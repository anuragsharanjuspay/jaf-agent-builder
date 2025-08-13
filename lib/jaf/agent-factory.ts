/**
 * JAF Agent Factory
 * Creates JAF agents from database configurations
 */

import { Agent, Tool, RunState } from '@xynehq/jaf'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createJAFAgent } from './core'
import { getToolsByIds } from '../jaf-tools'

export interface DBAgent {
  id: string
  name: string
  description: string | null
  model: string
  instructions: string
  modelConfig: any
  handoffs: string[]
  outputSchema: any
  memoryType: string | null
  memoryConfig: any
  inputGuardrails: any
  outputGuardrails: any
  tools: string[]
  capabilities: string[]
  systemPrompt: string
  config: any
  status: string
}

/**
 * Create a JAF agent from a database agent record
 */
export async function createJAFAgentFromDB(
  dbAgent: DBAgent | any
): Promise<Agent<any, any>> {
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
    instructions: (state: RunState<any>) => {
      // Template instructions with context if needed
      return instructions.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return state.context?.[key] || match
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
async function loadToolsForAgent(toolIds: string[]): Promise<Tool<any, any>[]> {
  if (!toolIds || toolIds.length === 0) {
    return []
  }
  
  // First try to get built-in tools
  const builtInTools = getToolsByIds(toolIds)
  
  // If we have all tools, return them
  if (builtInTools.length === toolIds.length) {
    return builtInTools
  }
  
  // Otherwise, load custom tools from database
  const customToolIds = toolIds.filter(
    id => !builtInTools.some(t => t.schema.name === id)
  )
  
  if (customToolIds.length > 0) {
    const customTools = await prisma.tool.findMany({
      where: {
        name: { in: customToolIds }
      }
    })
    
    const loadedCustomTools = await Promise.all(
      customTools.map(tool => createToolFromDB(tool))
    )
    
    return [...builtInTools, ...loadedCustomTools]
  }
  
  return builtInTools
}

/**
 * Create a tool from database configuration
 */
async function createToolFromDB(dbTool: any): Promise<Tool<any, any>> {
  // If schema is already defined, use it
  if (dbTool.schema) {
    const schema = typeof dbTool.schema === 'string' 
      ? JSON.parse(dbTool.schema)
      : dbTool.schema
    
    // Create the tool with custom implementation if provided
    if (dbTool.implementation) {
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
    execute: async (args: any) => {
      // Default implementation - just return a message
      return `Tool ${dbTool.name} called with args: ${JSON.stringify(args)}`
    }
  }
}

/**
 * Parse model configuration
 */
function parseModelConfig(config: any, model: string): any {
  const defaultConfig = {
    name: model,
    temperature: 0.7,
    maxTokens: 2000
  }
  
  if (!config) {
    return defaultConfig
  }
  
  const parsed = typeof config === 'string' ? JSON.parse(config) : config
  
  return {
    ...defaultConfig,
    ...parsed,
    name: parsed.name || model
  }
}

/**
 * Parse a Zod schema from JSON
 */
async function parseZodSchema(schemaJson: any): Promise<z.ZodType<any>> {
  if (!schemaJson) {
    return z.any()
  }
  
  // If it's already a Zod schema, return it
  if (schemaJson._def) {
    return schemaJson
  }
  
  // Parse from JSON representation
  const schema = typeof schemaJson === 'string' 
    ? JSON.parse(schemaJson)
    : schemaJson
  
  // Build Zod schema from JSON
  // This is a simplified version - in production you'd want a more robust parser
  if (schema.type === 'object' && schema.properties) {
    const shape: Record<string, z.ZodType<any>> = {}
    
    for (const [key, value] of Object.entries(schema.properties as any)) {
      shape[key] = parseZodType(value)
    }
    
    return z.object(shape)
  }
  
  return z.any()
}

/**
 * Parse individual Zod types
 */
function parseZodType(type: any): z.ZodType<any> {
  if (!type || !type.type) {
    return z.any()
  }
  
  switch (type.type) {
    case 'string':
      return z.string()
    case 'number':
      return z.number()
    case 'boolean':
      return z.boolean()
    case 'array':
      return z.array(parseZodType(type.items || {}))
    case 'object':
      if (type.properties) {
        const shape: Record<string, z.ZodType<any>> = {}
        for (const [key, value] of Object.entries(type.properties)) {
          shape[key] = parseZodType(value)
        }
        return z.object(shape)
      }
      return z.record(z.any())
    default:
      return z.any()
  }
}

/**
 * Validate agent configuration before creating
 */
export async function validateAgentConfiguration(agent: any): Promise<boolean> {
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
  await validateAgentConfiguration(updatedAgent)
  
  // Update the agent
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      ...updates,
      // Ensure instructions are set if only systemPrompt was provided
      instructions: updates.instructions || updates.systemPrompt || currentAgent.instructions,
      updatedAt: new Date()
    }
  })
}