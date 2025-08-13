/**
 * LiteLLM Provider for JAF
 * Integrates LiteLLM for unified access to multiple LLM providers
 */

import { makeLiteLLMProvider, ModelProvider } from '@xynehq/jaf'

export interface LiteLLMConfig {
  baseURL?: string
  apiKey?: string
  provider?: string
  model?: string
}

/**
 * Create a LiteLLM provider for JAF
 * 
 * LiteLLM acts as a proxy that provides a unified interface to multiple LLM providers:
 * - OpenAI (gpt-4, gpt-3.5-turbo, etc.)
 * - Anthropic (claude-3-opus, claude-3-sonnet, etc.)
 * - Google (gemini-pro, gemini-ultra, etc.)
 * - Azure OpenAI
 * - Cohere
 * - Replicate
 * - Hugging Face
 * - And 100+ other providers
 * 
 * @param config LiteLLM configuration
 * @returns ModelProvider for JAF
 */
export function createLiteLLMProvider(config: LiteLLMConfig = {}): ModelProvider<any> {
  // Default to local LiteLLM proxy or use provided URL
  const baseURL = config.baseURL || process.env.LITELLM_URL || 'http://localhost:4000'
  
  // LiteLLM can work without an API key if the proxy handles auth
  const apiKey = config.apiKey || process.env.LITELLM_API_KEY || 'anything'
  
  console.log('[JAF:LITELLM] Creating LiteLLM provider:', {
    baseURL,
    hasApiKey: !!apiKey,
    provider: config.provider
  })
  
  // Use JAF's built-in LiteLLM provider
  return makeLiteLLMProvider(baseURL, apiKey)
}

/**
 * Get the correct model name format for LiteLLM
 * 
 * LiteLLM uses specific prefixes for different providers:
 * - OpenAI: no prefix needed (gpt-4, gpt-3.5-turbo)
 * - Anthropic: anthropic/ prefix (anthropic/claude-3-opus)
 * - Google: gemini/ prefix (gemini/gemini-pro)
 * - Azure: azure/ prefix (azure/gpt-4)
 * - Cohere: cohere/ prefix (cohere/command)
 * 
 * @param model Model name from database
 * @param provider Optional provider hint
 * @returns Formatted model name for LiteLLM
 */
export function formatModelForLiteLLM(model: string, provider?: string): string {
  // If already formatted with provider prefix, return as-is
  if (model.includes('/')) {
    return model
  }
  
  // Map common model names to LiteLLM format
  const modelMappings: Record<string, string> = {
    // OpenAI models (no prefix needed)
    'gpt-4': 'gpt-4',
    'gpt-4-turbo': 'gpt-4-turbo-preview',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    
    // Anthropic models
    'claude-3-opus': 'anthropic/claude-3-opus-20240229',
    'claude-3-sonnet': 'anthropic/claude-3-sonnet-20240229',
    'claude-3-haiku': 'anthropic/claude-3-haiku-20240307',
    'claude-3.5-sonnet': 'anthropic/claude-3-5-sonnet-20240620',
    
    // Google models
    'gemini-pro': 'gemini/gemini-pro',
    'gemini-ultra': 'gemini/gemini-ultra',
    'gemini-2.0-flash': 'gemini/gemini-2.0-flash-thinking-exp-1219',
    
    // Cohere models
    'command': 'cohere/command',
    'command-light': 'cohere/command-light',
    'command-r': 'cohere/command-r',
    
    // Together AI models
    'llama-2-70b': 'together_ai/togethercomputer/llama-2-70b-chat',
    'mixtral-8x7b': 'together_ai/mistralai/Mixtral-8x7B-Instruct-v0.1',
    
    // Replicate models
    'llama-2-70b-chat': 'replicate/meta/llama-2-70b-chat',
    'mistral-7b': 'replicate/mistralai/mistral-7b-instruct-v0.1',
  }
  
  // Check if we have a mapping
  if (modelMappings[model]) {
    return modelMappings[model]
  }
  
  // If provider is specified, add the prefix
  if (provider) {
    const providerPrefixes: Record<string, string> = {
      'anthropic': 'anthropic/',
      'google': 'gemini/',
      'azure': 'azure/',
      'cohere': 'cohere/',
      'together': 'together_ai/',
      'replicate': 'replicate/',
      'huggingface': 'huggingface/',
      'openrouter': 'openrouter/',
    }
    
    const prefix = providerPrefixes[provider.toLowerCase()]
    if (prefix) {
      return `${prefix}${model}`
    }
  }
  
  // Default: return as-is (assume OpenAI format)
  return model
}

/**
 * Configuration for running a LiteLLM proxy server
 */
export interface LiteLLMProxyConfig {
  port?: number
  configPath?: string
  apiKeys?: Record<string, string>
}

/**
 * Get LiteLLM proxy configuration
 * 
 * This can be used to configure a local LiteLLM proxy server
 * that handles authentication and routing to different providers
 * 
 * @returns LiteLLM proxy configuration
 */
export function getLiteLLMProxyConfig(): LiteLLMProxyConfig {
  return {
    port: parseInt(process.env.LITELLM_PORT || '4000'),
    configPath: process.env.LITELLM_CONFIG_PATH || './litellm-config.yaml',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      google: process.env.GOOGLE_API_KEY || '',
      cohere: process.env.COHERE_API_KEY || '',
      replicate: process.env.REPLICATE_API_KEY || '',
      together: process.env.TOGETHER_API_KEY || '',
      azure: process.env.AZURE_API_KEY || '',
    }
  }
}

/**
 * Example LiteLLM configuration file content
 */
export const LITELLM_CONFIG_TEMPLATE = `
# LiteLLM Proxy Configuration
# Save this as litellm-config.yaml

model_list:
  # OpenAI Models
  - model_name: "gpt-4"
    litellm_params:
      model: "gpt-4"
      api_key: \${OPENAI_API_KEY}
  
  - model_name: "gpt-3.5-turbo"
    litellm_params:
      model: "gpt-3.5-turbo"
      api_key: \${OPENAI_API_KEY}
  
  # Anthropic Models
  - model_name: "claude-3-opus"
    litellm_params:
      model: "anthropic/claude-3-opus-20240229"
      api_key: \${ANTHROPIC_API_KEY}
  
  - model_name: "claude-3-sonnet"
    litellm_params:
      model: "anthropic/claude-3-sonnet-20240229"
      api_key: \${ANTHROPIC_API_KEY}
  
  # Google Models
  - model_name: "gemini-pro"
    litellm_params:
      model: "gemini/gemini-pro"
      api_key: \${GOOGLE_API_KEY}
  
  # Azure OpenAI
  - model_name: "azure-gpt-4"
    litellm_params:
      model: "azure/gpt-4"
      api_base: \${AZURE_API_BASE}
      api_key: \${AZURE_API_KEY}
      api_version: "2024-02-15-preview"

# General Settings
general_settings:
  master_key: \${LITELLM_MASTER_KEY}
  database_url: \${DATABASE_URL}
  
# Router Settings
router_settings:
  routing_strategy: "least-cost"  # or "latency-based", "simple-shuffle"
  model_group_alias: 
    "gpt-4": ["gpt-4", "azure-gpt-4"]
    "claude": ["claude-3-opus", "claude-3-sonnet"]

# To run LiteLLM proxy:
# litellm --config litellm-config.yaml --port 4000
`