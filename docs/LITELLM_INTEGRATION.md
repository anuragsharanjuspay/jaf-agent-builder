# LiteLLM Integration with JAF Agent Builder

## Overview

LiteLLM is integrated into JAF (Juspay Agent Framework) to provide unified access to 100+ LLM providers through a single interface. This allows JAF agents to seamlessly work with any LLM provider without changing code.

## How LiteLLM Works in JAF

### 1. **Built-in JAF Support**

JAF has native LiteLLM support through the `makeLiteLLMProvider` function:

```typescript
import { makeLiteLLMProvider } from '@xynehq/jaf/providers'

// Creates a ModelProvider that uses LiteLLM
const provider = makeLiteLLMProvider(baseURL, apiKey)
```

### 2. **Architecture**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   JAF Agent │────▶│   LiteLLM    │────▶│  LLM APIs   │
│             │     │    Proxy     │     │  (100+)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Unified   │
                    │   Interface │
                    └─────────────┘
```

### 3. **Provider Detection**

The system automatically detects when to use LiteLLM:

- When `USE_LITELLM=true` is set
- When `LITELLM_URL` is configured
- When using models with provider prefixes (e.g., `anthropic/claude-3-opus`)
- When using non-standard models (e.g., Llama, Mixtral)

## Setup Guide

### Option 1: Local LiteLLM Proxy (Recommended)

1. **Install LiteLLM**:
```bash
pip install litellm
```

2. **Configure API Keys** in `.env`:
```env
# LiteLLM Configuration
USE_LITELLM=true
LITELLM_URL=http://localhost:4000
LITELLM_MASTER_KEY=your-master-key  # Optional

# Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
COHERE_API_KEY=...
TOGETHER_API_KEY=...
REPLICATE_API_KEY=...
AZURE_API_KEY=...
OPENROUTER_API_KEY=...
```

3. **Start LiteLLM Proxy**:
```bash
litellm --config litellm-config.yaml --port 4000
```

4. **Create/Update Agent** with any supported model:
```typescript
{
  model: "gpt-4",              // OpenAI
  model: "claude-3-opus",      // Anthropic
  model: "gemini-pro",         // Google
  model: "llama-2-70b",        // Together AI
  model: "mixtral-8x7b",       // Together AI
  model: "command-r",          // Cohere
}
```

### Option 2: Direct Provider Usage

If you only need specific providers, JAF can connect directly:

```typescript
// Direct OpenAI
{ provider: 'openai', model: 'gpt-4' }

// Direct Anthropic
{ provider: 'anthropic', model: 'claude-3-opus' }

// Direct Google
{ provider: 'google', model: 'gemini-pro' }
```

## Supported Providers

LiteLLM supports 100+ providers. Here are the main ones:

| Provider | Models | Prefix | Example |
|----------|--------|--------|---------|
| OpenAI | GPT-4, GPT-3.5 | None | `gpt-4` |
| Anthropic | Claude 3 | `anthropic/` | `anthropic/claude-3-opus` |
| Google | Gemini | `gemini/` | `gemini/gemini-pro` |
| Azure OpenAI | GPT models | `azure/` | `azure/gpt-4` |
| Cohere | Command | `cohere/` | `cohere/command-r` |
| Together AI | Open source | `together_ai/` | `together_ai/llama-2-70b` |
| Replicate | Open source | `replicate/` | `replicate/mistral-7b` |
| Hugging Face | 1000+ models | `huggingface/` | `huggingface/meta-llama/Llama-2-70b` |
| OpenRouter | 100+ models | `openrouter/` | `openrouter/auto` |

## Advanced Features

### 1. **Load Balancing**

LiteLLM can distribute requests across multiple providers:

```yaml
router_settings:
  routing_strategy: "least-cost"  # or "latency-based"
  model_group_alias:
    "gpt-4": ["gpt-4", "azure-gpt-4", "claude-3-opus"]
```

### 2. **Fallback Models**

Automatic fallback when a provider is down:

```yaml
fallbacks:
  gpt-4: ["claude-3-opus", "gemini-ultra"]
  claude-3-opus: ["gpt-4", "gemini-ultra"]
```

### 3. **Cost Optimization**

LiteLLM tracks costs and can route to cheapest provider:

```yaml
router_settings:
  routing_strategy: "least-cost"
```

### 4. **Caching**

Cache responses to reduce costs:

```yaml
cache:
  type: "redis"
  ttl: 3600  # 1 hour
```

### 5. **Rate Limiting**

Prevent hitting API limits:

```yaml
router_settings:
  rpm: 1000    # Requests per minute
  tpm: 100000  # Tokens per minute
```

## Implementation in JAF

### Agent Factory Integration

```typescript
// lib/jaf/agent-factory.ts
const modelConfig = {
  name: formatModelForLiteLLM(dbAgent.model),
  temperature: 0.7,
  maxTokens: 2000
}
```

### Provider Selection

```typescript
// lib/jaf/provider.ts
export function getProviderFromModel(model: string) {
  // Auto-detect LiteLLM usage
  if (process.env.USE_LITELLM === 'true') {
    return 'litellm'
  }
  
  // Check for provider prefixes
  if (model.includes('/')) {
    return 'litellm'
  }
  
  // Standard providers
  if (model.includes('gpt')) return 'openai'
  if (model.includes('claude')) return 'anthropic'
  if (model.includes('gemini')) return 'google'
  
  return 'openai'
}
```

### Execution Flow

1. Agent configuration specifies model
2. System detects if LiteLLM should be used
3. If yes, creates `makeLiteLLMProvider`
4. LiteLLM proxy handles:
   - Provider routing
   - Authentication
   - Format conversion
   - Error handling
   - Retries and fallbacks

## Benefits

1. **Single Interface**: One API for all LLM providers
2. **Easy Switching**: Change models without code changes
3. **Cost Optimization**: Automatic routing to cheapest provider
4. **High Availability**: Automatic fallbacks
5. **Observability**: Built-in logging and monitoring
6. **Caching**: Reduce costs with response caching
7. **Rate Limiting**: Prevent API limit errors

## Testing with LiteLLM

```bash
# Test LiteLLM connection
curl http://localhost:4000/health

# Test model availability
curl http://localhost:4000/models

# Test completion
curl -X POST http://localhost:4000/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Troubleshooting

### LiteLLM not connecting
- Check if proxy is running: `ps aux | grep litellm`
- Verify port is not in use: `lsof -i :4000`
- Check logs: `litellm --debug`

### Model not found
- Verify model name in `litellm-config.yaml`
- Check API key is set for that provider
- Try with provider prefix: `anthropic/claude-3-opus`

### Authentication errors
- Verify API keys in environment
- Check LITELLM_MASTER_KEY if configured
- Ensure API keys have correct permissions

## Production Deployment

For production, consider:

1. **Docker deployment**:
```dockerfile
FROM python:3.11
RUN pip install litellm
COPY litellm-config.yaml /app/
CMD ["litellm", "--config", "/app/litellm-config.yaml", "--port", "4000"]
```

2. **Kubernetes deployment** with horizontal scaling
3. **Redis cache** for response caching
4. **Prometheus metrics** for monitoring
5. **Rate limiting** per user/API key
6. **Cost tracking** and budgets

## Conclusion

LiteLLM integration in JAF provides a powerful, flexible way to work with any LLM provider. The built-in support in JAF makes it seamless to use, while the proxy architecture provides advanced features like load balancing, fallbacks, and cost optimization.