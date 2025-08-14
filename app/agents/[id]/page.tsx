'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Agent } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Edit, Trash2 } from 'lucide-react'

export default function AgentDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/agents/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setAgent(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch agent:', error)
        setLoading(false)
      })
  }, [resolvedParams.id])

  const handleExport = async (format: 'jaf' | 'json') => {
    try {
      const response = await fetch(`/api/agents/${resolvedParams.id}/export?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${agent?.name.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'jaf' ? 'ts' : 'json'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export agent:', error)
      alert('Failed to export agent')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return
    }

    try {
      const response = await fetch(`/api/agents/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete agent')
      }

      router.push('/agents')
    } catch (error) {
      console.error('Failed to delete agent:', error)
      alert('Failed to delete agent')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading agent...</p>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8">
        <p>Agent not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/agents')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => router.push(`/agents/${resolvedParams.id}/playground`)}
          >
            Play
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('jaf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as JAF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/agents/${resolvedParams.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{agent.name}</CardTitle>
            {agent.description && (
              <CardDescription>{agent.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model</p>
                <p className="text-sm">{agent.model}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(agent.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated</p>
                <p className="text-sm">{new Date(agent.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
              {agent.systemPrompt}
            </pre>
          </CardContent>
        </Card>

        {agent.tools && Array.isArray(agent.tools) && agent.tools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
              <CardDescription>
                {agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.tools.map(toolId => (
                  <Badge key={toolId} variant="secondary">
                    {toolId}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {agent.knowledgeSources && Array.isArray(agent.knowledgeSources) && agent.knowledgeSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Sources</CardTitle>
              <CardDescription>
                {agent.knowledgeSources.length} source{agent.knowledgeSources.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agent.knowledgeSources.map((source, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{source.type}</Badge>
                    <span className="text-sm">{source.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}