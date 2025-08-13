import { Agent, Tool } from './types'

/**
 * Transform UI agent configuration to JAF-compatible TypeScript code
 */
export function agentConfigToJAF(agent: Agent, tools: Tool[]): string {
  const selectedTools = tools.filter(t => agent.tools.includes(t.id))
  const agentVarName = agent.name.replace(/[^a-zA-Z0-9]/g, '')
  
  const code = `import { Agent, Tool } from '@xynehq/jaf';
import { z } from 'zod';

// Define context type for your application
type AppContext = {
  userId: string;
  permissions: string[];
};

${selectedTools.map(tool => generateToolCode(tool)).join('\n\n')}

// Agent configuration
const ${agentVarName}Agent: Agent<AppContext, any> = {
  name: '${agent.name}',
  instructions: (state) => \`${agent.systemPrompt.replace(/`/g, '\\`')}\`,
  tools: [${selectedTools.map(t => t.name).join(', ')}],
  modelConfig: {
    name: '${agent.model}',
    temperature: 0.7,
    maxTokens: 1000
  }
};

export default ${agentVarName}Agent;
`

  return code
}

/**
 * Generate JAF tool code from tool definition
 */
function generateToolCode(tool: Tool): string {
  const params = tool.parameters as any[]
  
  // Generate Zod schema for parameters
  const zodSchema = generateZodSchema(params)
  
  return `// ${tool.displayName} Tool
const ${tool.name}: Tool<any, AppContext> = {
  schema: {
    name: "${tool.name}",
    description: "${tool.description || ''}",
    parameters: ${zodSchema}
  },
  execute: async (args, context) => {
    // TODO: Implement ${tool.displayName} logic
    return \`Executed ${tool.displayName} with args: \${JSON.stringify(args)}\`;
  }
};`
}

/**
 * Generate Zod schema from parameter definitions
 */
function generateZodSchema(params: any[]): string {
  if (!params || params.length === 0) {
    return 'z.object({})'
  }
  
  const fields = params.map(param => {
    let fieldSchema = ''
    
    switch (param.type) {
      case 'string':
        fieldSchema = 'z.string()'
        break
      case 'number':
        fieldSchema = 'z.number()'
        break
      case 'boolean':
        fieldSchema = 'z.boolean()'
        break
      case 'array':
        fieldSchema = 'z.array(z.any())'
        break
      default:
        fieldSchema = 'z.any()'
    }
    
    if (param.description) {
      fieldSchema += `.describe("${param.description}")`
    }
    
    if (!param.required) {
      fieldSchema += '.optional()'
    }
    
    return `    ${param.name}: ${fieldSchema}`
  })
  
  return `z.object({
${fields.join(',\n')}
  })`
}

/**
 * Export agent configuration as JSON
 */
export function exportAgentAsJSON(agent: Agent): string {
  return JSON.stringify({
    name: agent.name,
    description: agent.description,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    tools: agent.tools,
    capabilities: agent.capabilities,
    config: agent.config,
  }, null, 2)
}

/**
 * Import agent configuration from JAF code (basic parsing)
 */
export function importJAFAgent(code: string): Partial<Agent> | null {
  try {
    // Basic parsing - extract agent name and instructions
    const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const instructionsMatch = code.match(/instructions:\s*\([^)]*\)\s*=>\s*`([^`]+)`/);
    const modelMatch = code.match(/name:\s*['"`](gpt-4|gpt-3\.5-turbo|claude-[^'"`]+|gemini-[^'"`]+)['"`]/);
    
    if (!nameMatch || !instructionsMatch) {
      return null;
    }
    
    return {
      name: nameMatch[1],
      systemPrompt: instructionsMatch[1],
      model: modelMatch?.[1] || 'gpt-4',
      tools: [],
      capabilities: [],
    };
  } catch (error) {
    console.error('Failed to parse JAF code:', error);
    return null;
  }
}