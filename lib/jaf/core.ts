/**
 * Core JAF Integration
 * Handles the core JAF agent execution using the framework directly
 */

import { 
  run, 
  Agent, 
  RunState, 
  RunConfig,
  generateTraceId,
  generateRunId,
  Tool,
  ModelConfig,
  ModelProvider
} from '@xynehq/jaf'
import { z } from 'zod'
import { createModelProvider } from './provider'
import { 
  JAFContext,
  JAFExecutionOptions
} from './types'

// Re-export for backwards compatibility
export type { JAFExecutionOptions, JAFContext as JAFExecutionContext } from './types'

/**
 * Execute a JAF agent
 */
export async function executeJAFAgent<Ctx = JAFContext, Out = string>(
  agent: Agent<Ctx, Out>,
  input: string,
  context: Ctx,
  options: JAFExecutionOptions
): Promise<Out> {
  // Create the model provider - cast through unknown for generic type compatibility
  const modelProvider = createModelProvider(options.modelProvider) as unknown as ModelProvider<Ctx>
  
  // Create agent registry
  const agentRegistry = new Map<string, Agent<Ctx, unknown>>()
  agentRegistry.set(agent.name, agent)
  
  // Add handoff agents if specified
  if (agent.handoffs) {
    // In a real implementation, you'd load these from the database
    // For now, we'll just log a warning
    console.warn('[JAF:CORE] Handoffs specified but not loaded:', agent.handoffs)
  }
  
  // Create run configuration
  const runConfig: RunConfig<Ctx> = {
    agentRegistry,
    modelProvider,
    maxTurns: options.maxTurns || 10,
    // Memory configuration would go here - temporarily disabled for type compatibility
    ...(options.conversationId && {
      conversationId: options.conversationId
    })
  }
  
  // Create initial state
  const initialState: RunState<Ctx> = {
    traceId: generateTraceId(),
    runId: generateRunId(),
    messages: [
      {
        role: 'user',
        content: input
      }
    ],
    currentAgentName: agent.name,
    context,
    turnCount: 0
  }
  
  console.log('[JAF:CORE] Starting execution:', {
    agent: agent.name,
    traceId: initialState.traceId,
    runId: initialState.runId
  })
  
  // Execute the agent
  const result = await run<Ctx, Out>(initialState, runConfig)
  
  // Check for errors
  if (result.outcome.status === 'error') {
    throw new Error(`JAF execution error: ${JSON.stringify(result.outcome.error)}`)
  }
  
  return result.outcome.output
}

/**
 * Stream a JAF agent execution
 * Note: JAF doesn't have built-in streaming, so we'll implement a custom solution
 */
export async function* streamJAFAgent<Ctx = JAFContext>(
  agent: Agent<Ctx, string>,
  input: string,
  context: Ctx,
  options: JAFExecutionOptions
): AsyncGenerator<string, void, unknown> {
  // For now, we'll execute normally and yield the result
  // In a production implementation, you'd want to integrate with JAF's event system
  // JAF doesn't have built-in streaming support
  
  // Execute and yield the result in chunks
  try {
    const result = await executeJAFAgent(agent, input, context, {
      ...options,
      modelProvider: options.modelProvider
    })
    
    // Simulate streaming by yielding words
    const words = result.split(' ')
    for (const word of words) {
      yield word + ' '
    }
  } catch (error) {
    console.error('[JAF:CORE] Streaming error:', error)
    throw error
  }
}

/**
 * Create a JAF agent from configuration
 */
export function createJAFAgent<Ctx = JAFContext, Out = string>(
  config: {
    name: string
    instructions: string | ((state: RunState<Ctx>) => string)
    tools?: Tool<unknown, Ctx>[]
    modelConfig?: ModelConfig
    outputCodec?: z.ZodTypeAny // Zod schema for structured output
    handoffs?: string[]
  }
): Agent<Ctx, Out> {
  return {
    name: config.name,
    instructions: typeof config.instructions === 'string' 
      ? () => config.instructions as string
      : config.instructions,
    tools: config.tools,
    modelConfig: config.modelConfig,
    outputCodec: config.outputCodec,
    handoffs: config.handoffs
  }
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: Record<string, unknown>): boolean {
  // Basic validation
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Agent name is required and must be a string')
  }
  
  if (!config.instructions) {
    throw new Error('Agent instructions are required')
  }
  
  if (config.tools && !Array.isArray(config.tools)) {
    throw new Error('Tools must be an array')
  }
  
  if (config.handoffs && !Array.isArray(config.handoffs)) {
    throw new Error('Handoffs must be an array of agent names')
  }
  
  return true
}