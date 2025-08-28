import { z } from 'zod'

// Agent configuration schema
export const agentSchema = z.object({
  // Basic
  name: z.string().min(1, "Agent name is required"),
  description: z.string().optional(),
  model: z.string().min(1, "Model selection is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
  tools: z.array(z.string()).default([]), // ids or names
  capabilities: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),

  // JAF advanced (all optional)
  instructions: z.string().optional(),
  modelConfig: z.record(z.string(), z.unknown()).optional(),
  handoffs: z.array(z.string()).optional(),
  outputSchema: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
  memoryType: z.string().optional(),
  memoryConfig: z.record(z.string(), z.unknown()).optional(),
  inputGuardrails: z.record(z.string(), z.unknown()).optional(),
  outputGuardrails: z.record(z.string(), z.unknown()).optional(),
})

export type AgentConfig = z.infer<typeof agentSchema>

// Knowledge source schema
export const knowledgeSourceSchema = z.object({
  type: z.enum(['document', 'url', 'api']),
  name: z.string().min(1),
  source: z.string().min(1),
  settings: z.record(z.string(), z.unknown()).optional(),
})

export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>

// Tool definition schema
export const toolSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
  })),
  isBuiltin: z.boolean().default(false),
})

export type ToolDefinition = z.infer<typeof toolSchema>

// API response types
export interface Agent {
  id: string
  name: string
  description?: string | null
  model: string
  systemPrompt: string
  tools: string[]
  capabilities: string[]
  config?: Record<string, unknown>
  status: string
  userId: string
  teamId?: string | null
  createdAt: Date
  updatedAt: Date
  knowledgeSources?: KnowledgeSource[]
}

export interface ToolParameter {
  name: string
  type: string
  description: string
  required: boolean
}

export interface Tool {
  id: string
  name: string
  displayName: string
  description?: string | null
  category: string
  parameters: ToolParameter[] | Record<string, unknown>
  isBuiltin: boolean
  implementation?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// Available models
export const AVAILABLE_MODELS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
] as const

// Tool categories
export const TOOL_CATEGORIES = [
  'Search',
  'Math',
  'Data',
  'Communication',
  'File Management',
  'API Integration',
  'Custom',
] as const
