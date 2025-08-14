/**
 * JAF Type Definitions
 * Proper TypeScript types for JAF integration
 */

import { z } from 'zod'
import { 
  Agent as JAFAgent, 
  Tool as JAFTool,
  RunState as JAFRunState,
  ModelConfig as JAFModelConfig
} from '@xynehq/jaf'

// Context types
export interface JAFContext {
  userId: string
  agentId: string
  sessionId: string
  conversationId?: string
  metadata?: Record<string, unknown>
}

// Database Agent type with proper typing
export interface DBAgent {
  id: string
  name: string
  description: string | null
  model: string
  instructions: string
  modelConfig: JAFModelConfig | null
  handoffs: string[]
  outputSchema: z.ZodTypeAny | null
  memoryType: string | null
  memoryConfig: Record<string, unknown> | null
  inputGuardrails: Record<string, unknown> | null
  outputGuardrails: Record<string, unknown> | null
  tools: string[]
  capabilities: string[]
  systemPrompt: string
  config: Record<string, unknown> | null
  status: string
}

// Tool types
export interface DBTool {
  id: string
  name: string
  displayName: string
  description: string | null
  category: string
  schema: Record<string, unknown> | null
  parameters: Record<string, unknown>
  implementation: string | null
  isBuiltin: boolean
}

// Typed JAF Agent
export type TypedJAFAgent = JAFAgent<JAFContext, string>

// Typed JAF Tool
export type TypedJAFTool = JAFTool<unknown, JAFContext>

// Typed Run State
export type TypedRunState = JAFRunState<JAFContext>

// Model Provider Configuration
export interface ModelProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'litellm'
  apiKey: string
  baseURL?: string
  model?: string
}

// Execution Options
export interface JAFExecutionOptions {
  modelProvider: ModelProviderConfig
  maxTurns?: number
  streaming?: boolean
  conversationId?: string
  memory?: {
    type: 'in-memory' | 'redis' | 'postgres'
    config?: Record<string, unknown>
  }
}

// Runner Options
export interface RunnerOptions {
  apiKey?: string
  baseURL?: string
  streaming?: boolean
  userId?: string
  sessionId?: string
  conversationId?: string
}

// Execution Result
export interface ExecutionResult {
  executionId: string
  output: string
  durationMs: number
  error?: string
}

// Tool Schema
export interface ToolSchema {
  name: string
  description: string
  parameters: z.ZodTypeAny
}

// Tool Implementation
export type ToolExecuteFunction = (
  args: unknown,
  context: JAFContext
) => Promise<string>

// Structured Tool
export interface StructuredTool {
  schema: ToolSchema
  execute: ToolExecuteFunction
}

// Model Config with proper types
export interface ExtendedModelConfig extends JAFModelConfig {
  apiKey?: string
  baseURL?: string
  provider?: string
}

// Memory Configuration
export interface MemoryConfig {
  type: 'in-memory' | 'redis' | 'postgres'
  config?: {
    url?: string
    ttl?: number
    maxSize?: number
    [key: string]: unknown
  }
}

// Guardrail Configuration
export interface GuardrailConfig {
  inputGuardrails?: Array<{
    type: string
    config: Record<string, unknown>
  }>
  outputGuardrails?: Array<{
    type: string
    config: Record<string, unknown>
  }>
}

// Agent Creation Config
export interface AgentCreationConfig {
  name: string
  instructions: string | ((state: TypedRunState) => string)
  tools?: TypedJAFTool[]
  modelConfig?: JAFModelConfig
  outputCodec?: z.ZodTypeAny
  handoffs?: string[]
}

// Provider Response
export interface ProviderResponse {
  message?: {
    content?: string | null
    tool_calls?: Array<{
      id: string
      type: 'function'
      function: {
        name: string
        arguments: string
      }
    }>
  }
}

// Export all JAF types for convenience
export type {
  JAFAgent,
  JAFTool,
  JAFRunState,
  JAFModelConfig
}