/**
 * JAF Model Provider Implementation
 * Provides integration with various LLM providers for JAF
 */

import { ModelProvider, RunState, Agent, RunConfig, Message, makeLiteLLMProvider } from '@xynehq/jaf'
import { z } from 'zod'
import { ModelProviderConfig, JAFContext, ProviderResponse } from './types'

// Re-export for backwards compatibility
export type { ModelProviderConfig } from './types'

/**
 * Create a model provider for JAF
 */
export function createModelProvider(config: ModelProviderConfig): ModelProvider<JAFContext> {
  // If using LiteLLM, delegate to the LiteLLM provider
  if (config.provider === 'litellm') {
    const baseURL = config.baseURL || 
                   process.env.LITELLM_URL || 
                   process.env.NEXT_PUBLIC_LITELLM_URL || 
                   'http://localhost:4000'
    const apiKey = config.apiKey || process.env.LITELLM_API_KEY || 'anything'
    
    console.log('[JAF:PROVIDER] Using LiteLLM provider:', { baseURL })
    // return makeLiteLLMProvider(baseURL, apiKey)
    return makeLiteLLMProvider("http://localhost:4000", "sk-1234")
  }
  
  // Otherwise, use our custom implementations
  return {
    getCompletion: async (
      state: Readonly<RunState<JAFContext>>,
      agent: Readonly<Agent<JAFContext, unknown>>,
      runConfig: Readonly<RunConfig<JAFContext>>
    ) => {
      const modelName = runConfig.modelOverride || agent.modelConfig?.name || config.model || 'gpt-3.5-turbo'
      
      switch (config.provider) {
        case 'openai':
          return await getOpenAICompletion(state, agent, modelName, config)
        case 'anthropic':
          return await getAnthropicCompletion(state, agent, modelName, config)
        case 'google':
          return await getGoogleCompletion(state, agent, modelName, config)
        default:
          throw new Error(`Unsupported provider: ${config.provider}`)
      }
    }
  }
}

/**
 * OpenAI completion handler
 */
async function getOpenAICompletion(
  state: RunState<JAFContext>,
  agent: Agent<JAFContext, unknown>,
  model: string,
  config: ModelProviderConfig
): Promise<ProviderResponse> {
  const baseURL = config.baseURL || 'https://api.openai.com/v1'
  
  // Convert JAF messages to OpenAI format
  const messages = state.messages.map((msg: Message) => {
    if (msg.role === 'tool') {
      return {
        role: 'assistant',
        content: msg.content,
        tool_call_id: msg.tool_call_id
      }
    }
    return {
      role: msg.role,
      content: msg.content,
      ...(msg.tool_calls && { tool_calls: msg.tool_calls })
    }
  })
  
  // Add system prompt
  const systemMessage = {
    role: 'system',
    content: typeof agent.instructions === 'function' 
      ? agent.instructions(state)
      : agent.instructions
  }
  
  // Prepare tools if available
  const tools = agent.tools?.map(tool => ({
    type: 'function',
    function: {
      name: tool.schema.name,
      description: tool.schema.description,
      parameters: schemaToOpenAIParams(tool.schema.parameters)
    }
  }))
  
  const requestBody = {
    model,
    messages: [systemMessage, ...messages],
    temperature: agent.modelConfig?.temperature || 0.7,
    max_tokens: agent.modelConfig?.maxTokens || 2000,
    ...(tools && tools.length > 0 && { tools })
  }
  
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }
  
  const data = await response.json()
  const choice = data.choices[0]
  
  return {
    message: {
      content: choice.message.content,
      tool_calls: choice.message.tool_calls
    }
  }
}

/**
 * Anthropic completion handler
 */
async function getAnthropicCompletion(
  state: RunState<JAFContext>,
  agent: Agent<JAFContext, unknown>,
  model: string,
  config: ModelProviderConfig
): Promise<ProviderResponse> {
  const baseURL = config.baseURL || 'https://api.anthropic.com/v1'
  
  // Convert JAF messages to Anthropic format
  const messages = state.messages.map((msg: Message) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }))
  
  const systemPrompt = typeof agent.instructions === 'function' 
    ? agent.instructions(state)
    : agent.instructions
  
  const requestBody = {
    model: model || 'claude-3-sonnet-20240229',
    messages,
    system: systemPrompt,
    max_tokens: agent.modelConfig?.maxTokens || 2000,
    temperature: agent.modelConfig?.temperature || 0.7
  }
  
  const response = await fetch(`${baseURL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }
  
  const data = await response.json()
  
  return {
    message: {
      content: (data.content[0] as { text: string }).text
    }
  }
}

/**
 * Google completion handler
 */
async function getGoogleCompletion(
  state: RunState<JAFContext>,
  agent: Agent<JAFContext, unknown>,
  model: string,
  config: ModelProviderConfig
): Promise<ProviderResponse> {
  const baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta'
  
  // Convert JAF messages to Google format
  const contents = state.messages.map((msg: Message) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))
  
  const systemInstruction = typeof agent.instructions === 'function' 
    ? agent.instructions(state)
    : agent.instructions
  
  const requestBody = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: agent.modelConfig?.temperature || 0.7,
      maxOutputTokens: agent.modelConfig?.maxTokens || 2000
    }
  }
  
  const response = await fetch(
    `${baseURL}/models/${model || 'gemini-pro'}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google API error: ${error}`)
  }
  
  const data = await response.json()
  
  return {
    message: {
      content: (data.candidates[0].content.parts[0] as { text: string }).text
    }
  }
}

/**
 * Convert Zod schema to OpenAI function parameters
 */
function schemaToOpenAIParams(schema: z.ZodTypeAny): Record<string, unknown> {
  // Best-effort conversion from Zod to OpenAI tool parameters (JSON Schema-like)
  try {
    const resolve = (s: z.ZodTypeAny): any => {
      const def: any = (s as any)._def
      const typeName = def?.typeName
      switch (typeName) {
        case 'ZodString':
          return { type: 'string' }
        case 'ZodNumber':
          return { type: 'number' }
        case 'ZodBoolean':
          return { type: 'boolean' }
        case 'ZodArray':
          return { type: 'array', items: resolve(def.type) }
        case 'ZodObject': {
          const shape = typeof s.shape === 'function' ? s.shape() : def.shape()
          const properties: Record<string, unknown> = {}
          const required: string[] = []
          for (const key of Object.keys(shape)) {
            const field = shape[key]
            const isOptional = (field as any).isOptional?.() || (field as any)._def?.typeName === 'ZodOptional'
            properties[key] = resolve(field)
            if (!isOptional) required.push(key)
          }
          return { type: 'object', properties, required }
        }
        case 'ZodOptional':
          return resolve(def.innerType)
        case 'ZodUnion':
          return { anyOf: def.options?.map((o: any) => resolve(o)) || [] }
        case 'ZodEnum':
          return { type: 'string', enum: def.values }
        case 'ZodRecord':
          return { type: 'object', additionalProperties: true }
        default:
          return { type: 'string' }
      }
    }
    const json = resolve(schema)
    // Ensure root is an object as required by OpenAI tool params
    if (json.type !== 'object') {
      return { type: 'object', properties: { input: json }, required: [] }
    }
    return json
  } catch {
    return { type: 'object', properties: {}, required: [] }
  }
}

/**
 * Get provider from model name
 */
export function getProviderFromModel(model: string): 'openai' | 'anthropic' | 'google' | 'litellm' {
  // Check if LiteLLM is configured (check both server and client env vars)
  if (process.env.USE_LITELLM === 'true' || 
      process.env.NEXT_PUBLIC_USE_LITELLM === 'true' || 
      process.env.LITELLM_URL || 
      process.env.NEXT_PUBLIC_LITELLM_URL) {
    return 'litellm'
  }
  
  // Check for provider prefixes (LiteLLM format)
  if (model.includes('/')) {
    const [provider] = model.split('/')
    if (['anthropic', 'gemini', 'cohere', 'replicate', 'together_ai', 'azure', 'openrouter'].includes(provider)) {
      return 'litellm'
    }
  }
  
  // Standard provider detection
  if (model.includes('gpt')) return 'openai'
  if (model.includes('claude')) return 'anthropic'
  if (model.includes('gemini')) return 'google'
  
  // Less common models that would benefit from LiteLLM
  if (model.includes('llama') || model.includes('mixtral') || model.includes('mistral')) {
    return 'litellm'
  }
  
  return 'openai' // default
}
