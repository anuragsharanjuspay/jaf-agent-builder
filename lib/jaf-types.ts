import { z } from 'zod'

// Tool parameter types
export interface ToolExecutionContext {
  userId?: string
  agentId?: string
  conversationId?: string
}

// Tool parameter schemas
export const calculatorParamsSchema = z.object({
  expression: z.string().describe('Math expression to evaluate'),
})
export type CalculatorParams = z.infer<typeof calculatorParamsSchema>

export const webSearchParamsSchema = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().optional().describe('Maximum number of results'),
})
export type WebSearchParams = z.infer<typeof webSearchParamsSchema>

export const weatherParamsSchema = z.object({
  location: z.string().describe('City or coordinates'),
})
export type WeatherParams = z.infer<typeof weatherParamsSchema>

export const jsonParserParamsSchema = z.object({
  json: z.string().describe('JSON string to parse'),
  path: z.string().optional().describe('JSONPath to extract'),
})
export type JsonParserParams = z.infer<typeof jsonParserParamsSchema>

export const emailSenderParamsSchema = z.object({
  to: z.string().describe('Recipient email address'),
  subject: z.string().describe('Email subject'),
  body: z.string().describe('Email body'),
})
export type EmailSenderParams = z.infer<typeof emailSenderParamsSchema>

export const dataQueryParamsSchema = z.object({
  query: z.string().describe('SQL or query string'),
  database: z.string().optional().describe('Database name'),
})
export type DataQueryParams = z.infer<typeof dataQueryParamsSchema>

export const translatorParamsSchema = z.object({
  text: z.string().describe('Text to translate'),
  targetLanguage: z.string().describe('Target language code'),
  sourceLanguage: z.string().optional().describe('Source language code'),
})
export type TranslatorParams = z.infer<typeof translatorParamsSchema>

export const fileReaderParamsSchema = z.object({
  path: z.string().describe('File path to read'),
})
export type FileReaderParams = z.infer<typeof fileReaderParamsSchema>

export const fileWriterParamsSchema = z.object({
  path: z.string().describe('File path to write'),
  content: z.string().describe('Content to write'),
})
export type FileWriterParams = z.infer<typeof fileWriterParamsSchema>

export const httpRequestParamsSchema = z.object({
  url: z.string().describe('URL to request'),
  method: z.string().optional().describe('HTTP method (GET, POST, etc.)'),
  headers: z.record(z.string()).optional().describe('Request headers'),
  body: z.string().optional().describe('Request body'),
})
export type HttpRequestParams = z.infer<typeof httpRequestParamsSchema>

// Search result types
export interface SearchResult {
  title: string
  snippet: string
  url?: string
}

// Weather data type
export interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
}

// Database query result
export interface DatabaseRecord {
  id: number
  name: string
  email: string
  [key: string]: unknown
}

// Agent context for JAF
export interface AgentContext {
  userId: string
  agentId: string
  conversationId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

// Agent state
export interface AgentState {
  history: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  context: AgentContext
  toolCallCount: number
  lastToolResult?: string
}

// Tool result type
export type ToolResult = string | { error: string } | { data: unknown }

// Model configuration with proper types
export interface ModelConfiguration {
  name: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
}

// Extended model config for providers
export interface ProviderModelConfig extends ModelConfiguration {
  apiKey?: string
  baseURL?: string
  organizationId?: string
  projectId?: string
}