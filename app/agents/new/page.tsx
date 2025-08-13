'use client'

import { AgentForm } from '@/components/agents/agent-form'
import { Tool } from '@/lib/types'
import { useRouter } from 'next/navigation'

// Mock tools data - will be replaced with API call
const mockTools: Tool[] = [
  {
    id: 'calculator',
    name: 'calculator',
    displayName: 'Calculator',
    description: 'Perform mathematical calculations',
    category: 'Math',
    parameters: [
      {
        name: 'expression',
        type: 'string',
        description: 'Math expression to evaluate',
        required: true,
      },
    ],
    isBuiltin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'web-search',
    name: 'webSearch',
    displayName: 'Web Search',
    description: 'Search the web for information',
    category: 'Search',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true,
      },
    ],
    isBuiltin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function NewAgentPage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    // TODO: Submit to API
    console.log('Creating agent:', data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to agents list
    router.push('/agents')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
        <p className="text-muted-foreground">
          Configure your agent's behavior and capabilities
        </p>
      </div>
      <AgentForm tools={mockTools} onSubmit={handleSubmit} />
    </div>
  )
}