import { 
  run, 
  Tool, 
  Agent as JAFAgent, 
  RunState, 
  RunConfig, 
  generateTraceId, 
  generateRunId,
  Message
} from '@xynehq/jaf'
import { getToolsByIds } from './jaf-tools'
import { Agent as DBAgent } from './types'
import { AgentContext, AgentState, ProviderModelConfig } from './jaf-types'

export interface AgentRunOptions {
  apiKey?: string
  baseURL?: string
  streaming?: boolean
}

interface JAFAgentWithTools {
  agent: JAFAgent<AgentContext, AgentState>
  tools: Tool<unknown, AgentContext>[]
}

export function createJAFAgent(
  dbAgent: DBAgent,
  options: AgentRunOptions = {}
): JAFAgentWithTools {
  // Get the tools for this agent
  const tools = getToolsByIds(dbAgent.tools) as Tool<unknown, AgentContext>[]
  
  // Map model names to JAF format
  const modelMapping: Record<string, string> = {
    'gpt-4': 'openai:gpt-4',
    'gpt-4-turbo': 'openai:gpt-4-turbo-preview',
    'gpt-3.5-turbo': 'openai:gpt-3.5-turbo',
    'claude-3-opus': 'anthropic:claude-3-opus-20240229',
    'claude-3-sonnet': 'anthropic:claude-3-sonnet-20240229',
    'claude-3-haiku': 'anthropic:claude-3-haiku-20240307',
    'gemini-pro': 'google:gemini-pro',
    'gemini-2.0-flash': 'google:gemini-2.0-flash',
  }
  
  const modelName = modelMapping[dbAgent.model] || dbAgent.model
  
  // Create model configuration
  const modelConfig: ProviderModelConfig = {
    name: modelName,
    temperature: 0.7,
    maxTokens: 2000,
  }
  
  // Add API key if provided
  if (options.apiKey) {
    modelConfig.apiKey = options.apiKey
  }
  
  // Add base URL if provided
  if (options.baseURL) {
    modelConfig.baseURL = options.baseURL
  }
  
  // Create the JAF agent
  const jafAgent: JAFAgent<AgentContext, AgentState> = {
    name: dbAgent.name,
    instructions: () => dbAgent.systemPrompt,
    tools,
    modelConfig: modelConfig as JAFAgent<AgentContext, AgentState>['modelConfig'],
  }
  
  return { agent: jafAgent, tools }
}

export async function runAgent(
  dbAgent: DBAgent,
  input: string,
  options: AgentRunOptions = {}
): Promise<string> {
  try {
    const { agent, tools } = createJAFAgent(dbAgent, options)
    
    // Create initial context
    const context: AgentContext = {
      userId: 'temp-user-id',
      agentId: dbAgent.id,
      conversationId: generateRunId(),
    }
    
    // Create initial messages
    const messages: Message[] = [
      {
        role: 'user',
        content: input,
      }
    ]
    
    // Create initial state with proper RunState structure
    const initialState = {
      traceId: generateTraceId(),
      runId: generateRunId(),
      messages,
      turnCount: 0,
      currentAgentName: dbAgent.name,
      context,
    } as unknown as RunState<AgentContext>
    
    // Create run configuration with proper RunConfig structure
    // Note: These fields might need to be adjusted based on actual JAF implementation
    const config = {
      maxTurns: 10,
      agentRegistry: { [dbAgent.name]: agent },
      modelProvider: {
        getModel: () => agent.modelConfig,
      },
      tools,
      agent,
    } as unknown as RunConfig<AgentContext>
    
    // Run the agent
    const result = await run<AgentContext, string>(initialState, config)
    
    // Extract the final assistant message
    const assistantMessages = result.finalState.messages.filter(
      (m: Message) => m.role === 'assistant'
    )
    const lastMessage = assistantMessages[assistantMessages.length - 1]
    
    return lastMessage?.content || 'No response generated'
  } catch (error) {
    console.error('Error running agent:', error)
    throw error
  }
}

export async function* streamAgent(
  dbAgent: DBAgent,
  input: string,
  options: AgentRunOptions = {}
): AsyncGenerator<string, void, unknown> {
  // For now, streaming is not supported in our implementation
  // Return the full response as a single chunk
  const response = await runAgent(dbAgent, input, options)
  yield response
}