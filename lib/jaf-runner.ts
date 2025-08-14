import { getToolsByIds } from './jaf-tools'
import { Agent as DBAgent } from './types'

export interface AgentRunOptions {
  apiKey?: string
  baseURL?: string
  streaming?: boolean
}

// Simple mock implementation for now
export async function runAgent(
  dbAgent: DBAgent,
  input: string,
  options: AgentRunOptions = {}
): Promise<string> {
  try {
    console.log('[JAF:RUNNER] Starting agent execution:', {
      agentName: dbAgent.name,
      model: dbAgent.model,
      toolCount: dbAgent.tools.length,
      hasApiKey: !!options.apiKey,
      input
    })

    // For now, we'll use OpenAI directly until JAF issues are resolved
    if (!options.apiKey) {
      throw new Error('API key is required')
    }

    // Get the tools for this agent (for future use)
    const tools = getToolsByIds(dbAgent.tools)
    console.log('[JAF:RUNNER] Tools loaded:', tools.map(t => t.schema.name))

    // Map model names to OpenAI model names
    const modelMapping: Record<string, string> = {
      'gpt-4': 'gpt-4',
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-5-sonnet-20240620',
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'gemini-pro': 'gemini-pro',
      'gemini-2.0-flash': 'gemini-2.0-flash-thinking-exp-1219',
    }
    
    const modelName = modelMapping[dbAgent.model] || dbAgent.model
    
    // Use OpenAI API directly
    const baseURL = options.baseURL || 'https://api.openai.com/v1'
    
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName.startsWith('gpt') ? modelName : 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: dbAgent.systemPrompt,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[JAF:RUNNER] API Error:', errorData)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[JAF:RUNNER] API Response received:', JSON.stringify(data, null, 2))
    
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message?.content || 'No response generated'
      console.log('[JAF:RUNNER] Extracted content:', content)
      return content
    }
    
    return 'No response generated'
  } catch (error) {
    console.error('[JAF:RUNNER] Error running agent:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing API key. Please provide a valid API key.')
      } else if (error.message.includes('model')) {
        throw new Error(`Model configuration error: ${error.message}`)
      } else {
        throw new Error(`Agent execution failed: ${error.message}`)
      }
    }
    
    throw error
  }
}

export async function* streamAgent(
  dbAgent: DBAgent,
  input: string,
  options: AgentRunOptions = {}
): AsyncGenerator<string, void, unknown> {
  try {
    console.log('[JAF:RUNNER] Starting streaming agent execution')
    
    if (!options.apiKey) {
      throw new Error('API key is required')
    }

    // Map model names to OpenAI model names
    const modelMapping: Record<string, string> = {
      'gpt-4': 'gpt-4',
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-5-sonnet-20240620',
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'gemini-pro': 'gemini-pro',
      'gemini-2.0-flash': 'gemini-2.0-flash-thinking-exp-1219',
    }
    
    const modelName = modelMapping[dbAgent.model] || dbAgent.model
    const baseURL = options.baseURL || 'https://api.openai.com/v1'
    
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName.startsWith('gpt') ? modelName : 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: dbAgent.systemPrompt,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[JAF:RUNNER] Streaming API Error:', errorData)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    console.error('[JAF:RUNNER] Error streaming agent:', error)
    throw error
  }
}