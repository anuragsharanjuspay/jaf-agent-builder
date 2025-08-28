'use client'

import { useState, useEffect, use } from 'react'
import { AgentForm } from '@/components/agents/agent-form'
import { Tool, AgentConfig, Agent } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function EditAgentPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [agent, setAgent] = useState<AgentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [knowledgeSources, setKnowledgeSources] = useState<any[]>([])

  useEffect(() => {
    // Fetch both tools and agent data
    Promise.all([
      fetch('/api/tools').then(res => res.json()),
      fetch(`/api/agents/${resolvedParams.id}`).then(res => res.json())
    ])
      .then(([toolsData, agentData]: [Tool[], Agent]) => {
        setTools(toolsData)
        // Convert Agent to AgentConfig
        setAgent({
          name: agentData.name,
          description: agentData.description || '',
          model: agentData.model,
          instructions: (agentData as any).instructions || agentData.systemPrompt,
          tools: agentData.tools,
          capabilities: agentData.capabilities,
          status: agentData.status as 'draft' | 'active' | 'archived',
        })
        setKnowledgeSources(agentData.knowledgeSources || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch data:', error)
        setLoading(false)
      })
  }, [resolvedParams.id])

  const handleSubmit = async (data: AgentConfig) => {
    try {
      const response = await fetch(`/api/agents/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update agent')
      }

      const updatedAgent = await response.json()
      
      // Redirect to agent detail page
      router.push(`/agents/${updatedAgent.id}`)
    } catch (error) {
      console.error('Error updating agent:', error)
      alert('Failed to update agent. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground">Loading agent data...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground">Agent not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
        <p className="text-muted-foreground">
          Update your agent&apos;s configuration
        </p>
      </div>
      <AgentForm agent={agent} tools={tools} initialKnowledgeSources={knowledgeSources as any} onSubmit={handleSubmit} />
    </div>
  )
}
