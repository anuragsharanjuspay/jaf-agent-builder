'use client'

import { useState, useEffect } from 'react'
import { AgentForm } from '@/components/agents/agent-form'
import { Tool, AgentConfig } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function NewAgentPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch available tools from API
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        setTools(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch tools:', error)
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (data: AgentConfig) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create agent')
      }

      const agent = await response.json()
      
      // Redirect to agent detail page
      router.push(`/agents/${agent.id}`)
    } catch (error) {
      console.error('Error creating agent:', error)
      alert('Failed to create agent. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
        <p className="text-muted-foreground">
          Configure your agent&apos;s behavior and capabilities
        </p>
      </div>
      <AgentForm tools={tools} onSubmit={handleSubmit} />
    </div>
  )
}