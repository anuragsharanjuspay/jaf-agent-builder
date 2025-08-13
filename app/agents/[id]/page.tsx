'use client'

import { AgentForm } from '@/components/agents/agent-form'
import { Tool, AgentConfig } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { use } from 'react'

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

// Mock agent data
const mockAgent: AgentConfig = {
  name: 'Customer Support Agent',
  description: 'Handles customer inquiries and support tickets',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful customer support agent...',
  tools: ['calculator'],
  capabilities: ['chat', 'search'],
  status: 'active',
}

interface EditAgentPageProps {
  params: Promise<{ id: string }>
}

export default function EditAgentPage({ params }: EditAgentPageProps) {
  const router = useRouter()
  const { id } = use(params)

  const handleSubmit = async (data: any) => {
    // TODO: Submit to API
    console.log('Updating agent:', id, data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to agents list
    router.push('/agents')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
        <p className="text-muted-foreground">
          Update your agent's configuration
        </p>
      </div>
      <AgentForm agent={mockAgent} tools={mockTools} onSubmit={handleSubmit} />
    </div>
  )
}