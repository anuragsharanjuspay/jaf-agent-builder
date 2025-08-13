/**
 * JAF Model Provider Implementation
 * Provides integration with various LLM providers for JAF
 */

import { ModelProvider, RunState, Agent, RunConfig, Message, makeLiteLLMProvider } from '@xynehq/jaf'
import { formatModelForLiteLLM } from './litellm-provider'

export interface ModelProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'litellm'
  apiKey: string
  baseURL?: string
  model?: string
}

/**
 * Create a model provider for JAF
 */
export function createModelProvider(config: ModelProviderConfig): ModelProvider<any> {
  // If using LiteLLM, delegate to the LiteLLM provider
  if (config.provider === 'litellm') {
    const baseURL = config.baseURL || process.env.LITELLM_URL || 'http://localhost:4000'
    const apiKey = config.apiKey || process.env.LITELLM_API_KEY || 'anything'
    
    console.log('[JAF:PROVIDER] Using LiteLLM provider:', { baseURL })
    return makeLiteLLMProvider(baseURL, apiKey)
  }
  
  // Otherwise, use our custom implementations
  return {
    getCompletion: async (
      state: Readonly<RunState<any>>,
      agent: Readonly<Agent<any, any>>,
      runConfig: Readonly<RunConfig<any>>
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
  state: RunState<any>,
  agent: Agent<any, any>,
  model: string,
  config: ModelProviderConfig
) {
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
  state: RunState<any>,
  agent: Agent<any, any>,
  model: string,
  config: ModelProviderConfig
) {
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
      content: data.content[0].text
    }
  }
}

/**
 * Google completion handler
 */
async function getGoogleCompletion(
  state: RunState<any>,
  agent: Agent<any, any>,
  model: string,
  config: ModelProviderConfig
) {
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
      content: data.candidates[0].content.parts[0].text
    }
  }
}

/**
 * Convert Zod schema to OpenAI function parameters
 */
function schemaToOpenAIParams(schema: any): any {
  // This is a simplified version - in production, you'd want to properly
  // introspect the Zod schema and convert it to JSON Schema
  return {
    type: 'object',
    properties: {},
    required: []
  }
}

/**
 * Get provider from model name
 */
export function getProviderFromModel(model: string): 'openai' | 'anthropic' | 'google' | 'litellm' {
  // Check if LiteLLM is configured
  if (process.env.USE_LITELLM === 'true' || process.env.LITELLM_URL) {
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