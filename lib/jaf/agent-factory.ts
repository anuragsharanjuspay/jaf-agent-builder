/**
 * JAF Agent Factory
 * Creates JAF agents from database configurations
 */

import { z } from 'zod'
import { RunState } from '@xynehq/jaf'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { createJAFAgent } from './core'
import { getToolsByIds } from '../jaf-tools'
import { 
  DBAgent, 
  DBTool, 
  TypedJAFAgent, 
  TypedJAFTool,
  JAFContext,
  JAFModelConfig
} from './types'

// Re-export DBAgent for backward compatibility
export type { DBAgent } from './types'

/**
 * Create a JAF agent from a database agent record
 */
export async function createJAFAgentFromDB(
  dbAgent: DBAgent
): Promise<TypedJAFAgent> {
  console.log('[JAF:FACTORY] Creating agent from DB:', {
    id: dbAgent.id,
    name: dbAgent.name,
    model: dbAgent.model,
    toolCount: dbAgent.tools?.length || 0
  })
  
  // Use instructions if available, otherwise fall back to systemPrompt
  const instructions = dbAgent.instructions || dbAgent.systemPrompt || 'You are a helpful assistant.'
  
  // Load tools
  const tools = await loadToolsForAgent(dbAgent.tools || [])
  
  // Parse model configuration
  const modelConfig = parseModelConfig(dbAgent.modelConfig, dbAgent.model)
  
  // Parse output schema if provided
  const outputCodec = dbAgent.outputSchema ? 
    await parseZodSchema(dbAgent.outputSchema) : undefined
  
  // Create the JAF agent
  const agent = createJAFAgent({
    name: dbAgent.name,
    instructions: (state: RunState<JAFContext>) => {
      // Template instructions with context if needed
      return instructions.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
        return state.context?.[key as keyof JAFContext] as string || match
      })
    },
    tools,
    modelConfig,
    outputCodec,
    handoffs: dbAgent.handoffs || []
  })
  
  return agent
}

/**
 * Load tools for an agent
 */
async function loadToolsForAgent(toolIds: string[]): Promise<TypedJAFTool[]> {
  if (!toolIds || toolIds.length === 0) {
    return []
  }

  // Normalize and dedupe incoming identifiers
  const uniqueIds = Array.from(new Set(toolIds.filter(Boolean)))

  // 1) Resolve built-in tools by name (registry keys)
  const builtInByName = getToolsByIds(uniqueIds)

  // Track selected tool names to avoid duplicates
  const selectedByName = new Set<string>(builtInByName.map(t => t.schema.name))

  // 2) Load matching DB tool rows by either id or name for any unresolved identifiers
  const unresolved = uniqueIds.filter(id => !selectedByName.has(id))
  let dbTools: DBTool[] = []
  if (unresolved.length > 0) {
    const rows = await prisma.tool.findMany({
      where: {
        OR: [
          { id: { in: unresolved } },
          { name: { in: unresolved } },
        ]
      }
    })
    dbTools = rows as unknown as DBTool[]
  }

  // 3) For DB tools that correspond to built-ins (matched by name), prefer the built-in implementation
  const builtInFromDB: TypedJAFTool[] = []
  for (const row of dbTools) {
    if (!row?.name) continue
    if (selectedByName.has(row.name)) continue // already included
    const reg = getToolsByIds([row.name])
    if (reg.length > 0) {
      builtInFromDB.push(reg[0] as TypedJAFTool)
      selectedByName.add(row.name)
    }
  }

  // 4) Remaining DB tools become custom tools
  const customDBTools = dbTools.filter(row => !selectedByName.has(row.name))
  const customResolved = await Promise.all(customDBTools.map(t => createToolFromDB(t)))

  // 5) Return combined unique list
  return [...(builtInByName as TypedJAFTool[]), ...builtInFromDB, ...customResolved]
}

/**
 * Create a tool from database configuration
 */
async function createToolFromDB(dbTool: DBTool): Promise<TypedJAFTool> {
  // If schema is already defined, use it
  if (dbTool.schema) {
    const schema = typeof dbTool.schema === 'string' 
      ? JSON.parse(dbTool.schema)
      : dbTool.schema
    
    // Create the tool with custom implementation if provided
    if (dbTool.implementation && process.env.ENABLE_DB_TOOL_CODE === 'true') {
      try {
        // Safely evaluate the implementation
        const executeFunc = new Function('return ' + dbTool.implementation)()
        
        return {
          schema,
          execute: executeFunc
        }
      } catch (error) {
        console.error('[JAF:FACTORY] Error loading tool implementation:', error)
      }
    }
  }
  
  // Fallback: create from parameters
  const parameters = typeof dbTool.parameters === 'string'
    ? JSON.parse(dbTool.parameters)
    : dbTool.parameters
  
  return {
    schema: {
      name: dbTool.name,
      description: dbTool.description || '',
      parameters: await parseZodSchema(parameters)
    },
    execute: async (args: unknown) => {
      // Default implementation - just return a message
      return `Tool ${dbTool.name} called with args: ${JSON.stringify(args)}`
    }
  }
}

/**
 * Parse model configuration
 */
function parseModelConfig(config: unknown, model: string): JAFModelConfig {
  const defaultConfig = {
    name: model,
    temperature: 0.7,
    maxTokens: 2000
  }
  
  if (!config) {
    return defaultConfig
  }
  
  const parsed = typeof config === 'string' ? JSON.parse(config) : config as Record<string, unknown>
  
  return {
    ...defaultConfig,
    ...parsed,
    name: parsed.name || model
  }
}

/**
 * Parse a Zod schema from JSON
 */
async function parseZodSchema(schemaJson: unknown): Promise<z.ZodTypeAny> {
  if (!schemaJson) {
    return z.unknown()
  }
  
  // If it's already a Zod schema, return it
  const zodSchema = schemaJson as z.ZodTypeAny
  if (zodSchema._def) {
    return zodSchema
  }
  
  // Parse from JSON representation
  const schema = typeof schemaJson === 'string' 
    ? JSON.parse(schemaJson) as Record<string, unknown>
    : schemaJson as Record<string, unknown>
  
  // Build Zod schema from JSON
  // This is a simplified version - in production you'd want a more robust parser
  if (schema.type === 'object' && schema.properties) {
    const shape: Record<string, z.ZodTypeAny> = {}
    
    for (const [key, value] of Object.entries(schema.properties as Record<string, unknown>)) {
      shape[key] = parseZodType(value)
    }
    
    return z.object(shape)
  }
  
  return z.unknown()
}

/**
 * Parse individual Zod types
 */
function parseZodType(type: unknown): z.ZodTypeAny {
  const typeObj = type as Record<string, unknown>
  if (!typeObj || !typeObj.type) {
    return z.unknown()
  }
  
  switch (typeObj.type) {
    case 'string':
      return z.string()
    case 'number':
      return z.number()
    case 'boolean':
      return z.boolean()
    case 'array':
      return z.array(parseZodType(typeObj.items || {}))
    case 'object':
      if (typeObj.properties) {
        const shape: Record<string, z.ZodTypeAny> = {}
        for (const [key, value] of Object.entries(typeObj.properties as Record<string, unknown>)) {
          shape[key] = parseZodType(value)
        }
        return z.object(shape)
      }
      return z.record(z.unknown())
    default:
      return z.unknown()
  }
}

/**
 * Validate agent configuration before creating
 */
export async function validateAgentConfiguration(agent: Partial<DBAgent>): Promise<boolean> {
  // Basic validation
  if (!agent.name) {
    throw new Error('Agent name is required')
  }
  
  if (!agent.model) {
    throw new Error('Agent model is required')
  }
  
  // Validate tools exist
  if (agent.tools && agent.tools.length > 0) {
    const tools = await loadToolsForAgent(agent.tools)
    if (tools.length !== agent.tools.length) {
      throw new Error('Some tools could not be loaded')
    }
  }
  
  // Validate handoffs (if specified)
  if (agent.handoffs && agent.handoffs.length > 0) {
    const handoffAgents = await prisma.agent.findMany({
      where: {
        name: { in: agent.handoffs }
      },
      select: { name: true }
    })
    
    const foundNames = handoffAgents.map(a => a.name)
    const missingHandoffs = agent.handoffs.filter((h: string) => !foundNames.includes(h))
    
    if (missingHandoffs.length > 0) {
      console.warn('[JAF:FACTORY] Missing handoff agents:', missingHandoffs)
    }
  }
  
  return true
}

/**
 * Update an existing agent with JAF configuration
 */
export async function updateAgentWithJAFConfig(
  agentId: string,
  updates: Partial<DBAgent>
): Promise<void> {
  // Validate the configuration
  const currentAgent = await prisma.agent.findUnique({
    where: { id: agentId }
  })
  
  if (!currentAgent) {
    throw new Error('Agent not found')
  }
  
  const updatedAgent = { ...currentAgent, ...updates }
  await validateAgentConfiguration(updatedAgent as Partial<DBAgent>)
  
  // Update the agent - using unknown for Prisma type compatibility
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      ...updates,
      modelConfig: updates.modelConfig as unknown as Prisma.InputJsonValue,
      // Ensure instructions are set if only systemPrompt was provided
      instructions: updates.instructions || updates.systemPrompt || currentAgent.instructions,
      updatedAt: new Date()
    } as unknown as Prisma.AgentUpdateInput
  })
}
