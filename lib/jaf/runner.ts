/**
 * JAF Runner
 * Main execution layer for JAF agents
 */

import { prisma } from '@/lib/db'
import { createJAFAgentFromDB } from './agent-factory'
import { executeJAFAgent, streamJAFAgent, JAFExecutionContext } from './core'
import { getProviderFromModel } from './provider'

export interface RunnerOptions {
  apiKey?: string
  baseURL?: string
  streaming?: boolean
  userId?: string
  sessionId?: string
  conversationId?: string
}

/**
 * Run a JAF agent by ID
 */
export async function runJAFAgent(
  agentId: string,
  input: string,
  options: RunnerOptions = {}
): Promise<string> {
  console.log('[JAF:RUNNER] Starting agent execution:', {
    agentId,
    input,
    hasApiKey: !!options.apiKey,
    streaming: options.streaming
  })
  
  // Fetch the agent from database
  const dbAgent = await prisma.agent.findUnique({
    where: { id: agentId }
  })
  
  if (!dbAgent) {
    throw new Error(`Agent not found: ${agentId}`)
  }
  
  // Create JAF agent from database configuration
  const agent = await createJAFAgentFromDB(dbAgent)
  
  // Determine the provider
  const provider = getProviderFromModel(dbAgent.model)
  
  // Use LiteLLM if configured, otherwise require API key
  if (provider === 'litellm') {
    // LiteLLM can use its own authentication
    options.apiKey = options.apiKey || process.env.LITELLM_API_KEY || 'default'
  } else if (!options.apiKey) {
    throw new Error(`API key required for provider: ${provider}`)
  }
  
  // Create execution context
  const context: JAFExecutionContext = {
    userId: options.userId || 'anonymous',
    agentId,
    sessionId: options.sessionId || `session-${Date.now()}`,
    metadata: {
      input,
      model: dbAgent.model,
      provider
    }
  }
  
  // Execute the agent
  try {
    const result = await executeJAFAgent(
      agent,
      input,
      context,
      {
        modelProvider: {
          provider,
          apiKey: options.apiKey,
          baseURL: options.baseURL,
          model: dbAgent.model
        },
        maxTurns: 10,
        conversationId: options.conversationId,
        memory: dbAgent.memoryType ? {
          type: dbAgent.memoryType as any,
          config: dbAgent.memoryConfig
        } : undefined
      }
    )
    
    // Convert result to string if needed
    if (typeof result === 'string') {
      return result
    } else if (result && typeof result === 'object') {
      return JSON.stringify(result, null, 2)
    } else {
      return String(result)
    }
  } catch (error) {
    console.error('[JAF:RUNNER] Execution error:', error)
    throw error
  }
}

/**
 * Stream a JAF agent execution
 */
export async function* streamJAFAgentExecution(
  agentId: string,
  input: string,
  options: RunnerOptions = {}
): AsyncGenerator<string, void, unknown> {
  console.log('[JAF:RUNNER] Starting streaming execution:', {
    agentId,
    input,
    hasApiKey: !!options.apiKey
  })
  
  // Fetch the agent from database
  const dbAgent = await prisma.agent.findUnique({
    where: { id: agentId }
  })
  
  if (!dbAgent) {
    throw new Error(`Agent not found: ${agentId}`)
  }
  
  // Create JAF agent from database configuration
  const agent = await createJAFAgentFromDB(dbAgent)
  
  // Determine the provider
  const provider = getProviderFromModel(dbAgent.model)
  
  // Use LiteLLM if configured, otherwise require API key
  if (provider === 'litellm') {
    // LiteLLM can use its own authentication
    options.apiKey = options.apiKey || process.env.LITELLM_API_KEY || 'default'
  } else if (!options.apiKey) {
    throw new Error(`API key required for provider: ${provider}`)
  }
  
  // Create execution context
  const context: JAFExecutionContext = {
    userId: options.userId || 'anonymous',
    agentId,
    sessionId: options.sessionId || `session-${Date.now()}`,
    metadata: {
      input,
      model: dbAgent.model,
      provider
    }
  }
  
  // Stream the execution
  try {
    for await (const chunk of streamJAFAgent(
      agent,
      input,
      context,
      {
        modelProvider: {
          provider,
          apiKey: options.apiKey,
          baseURL: options.baseURL,
          model: dbAgent.model
        },
        maxTurns: 10,
        streaming: true,
        conversationId: options.conversationId,
        memory: dbAgent.memoryType ? {
          type: dbAgent.memoryType as any,
          config: dbAgent.memoryConfig
        } : undefined
      }
    )) {
      yield chunk
    }
  } catch (error) {
    console.error('[JAF:RUNNER] Streaming error:', error)
    throw error
  }
}

/**
 * Create and save an execution record
 */
export async function createExecutionRecord(
  agentId: string,
  input: string,
  metadata?: any
) {
  return await prisma.agentExecution.create({
    data: {
      agentId,
      input,
      status: 'running',
      metadata
    }
  })
}

/**
 * Update an execution record
 */
export async function updateExecutionRecord(
  executionId: string,
  updates: {
    output?: string
    status?: string
    error?: string
    durationMs?: number
    completedAt?: Date
    traceId?: string
    runId?: string
  }
) {
  return await prisma.agentExecution.update({
    where: { id: executionId },
    data: updates
  })
}

/**
 * Main entry point for running agents
 */
export async function runAgent(
  agentId: string,
  input: string,
  options: RunnerOptions = {}
): Promise<{
  executionId: string
  output: string
  durationMs: number
}> {
  // Create execution record
  const execution = await createExecutionRecord(agentId, input, {
    ...options,
    timestamp: new Date().toISOString()
  })
  
  const startTime = Date.now()
  
  try {
    // Run the agent
    const output = await runJAFAgent(agentId, input, options)
    const durationMs = Date.now() - startTime
    
    // Update execution record
    await updateExecutionRecord(execution.id, {
      output,
      status: 'completed',
      durationMs,
      completedAt: new Date()
    })
    
    return {
      executionId: execution.id,
      output,
      durationMs
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    
    // Update execution record with error
    await updateExecutionRecord(execution.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      durationMs,
      completedAt: new Date()
    })
    
    throw error
  }
}

/**
 * Stream agent execution with proper error handling
 */
export async function* streamAgent(
  agentId: string,
  input: string,
  options: RunnerOptions = {}
): AsyncGenerator<string, void, unknown> {
  // Create execution record
  const execution = await createExecutionRecord(agentId, input, {
    ...options,
    streaming: true,
    timestamp: new Date().toISOString()
  })
  
  const startTime = Date.now()
  let fullOutput = ''
  
  try {
    // Stream the agent execution
    for await (const chunk of streamJAFAgentExecution(agentId, input, options)) {
      fullOutput += chunk
      yield chunk
    }
    
    const durationMs = Date.now() - startTime
    
    // Update execution record
    await updateExecutionRecord(execution.id, {
      output: fullOutput,
      status: 'completed',
      durationMs,
      completedAt: new Date()
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    
    // Update execution record with error
    await updateExecutionRecord(execution.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      durationMs,
      completedAt: new Date()
    })
    
    throw error
  }
}