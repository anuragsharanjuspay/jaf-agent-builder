'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Tool, ToolParameter } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Code, FileJson } from 'lucide-react'

export default function ToolDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tools/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setTool(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch tool:', error)
        setLoading(false)
      })
  }, [resolvedParams.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/tools/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete tool')
      }

      router.push('/tools')
    } catch (error) {
      console.error('Failed to delete tool:', error)
      alert('Failed to delete tool. It may be in use by existing agents.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading tool...</p>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="container mx-auto py-8">
        <p>Tool not found</p>
      </div>
    )
  }

  const parameters = Array.isArray(tool.parameters) 
    ? tool.parameters as ToolParameter[]
    : []

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/tools')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </div>
        <div className="flex gap-2">
          {!tool.isBuiltin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tools/${resolvedParams.id}/edit`)}
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
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {tool.displayName}
                </CardTitle>
                {tool.description && (
                  <CardDescription className="mt-2">
                    {tool.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{tool.category}</Badge>
                {tool.isBuiltin && (
                  <Badge variant="secondary">Built-in</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tool Name (ID)</p>
                <p className="text-sm font-mono">{tool.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(tool.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Parameters
            </CardTitle>
            <CardDescription>
              {parameters.length} parameter{parameters.length !== 1 ? 's' : ''} defined
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parameters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parameters defined</p>
            ) : (
              <div className="space-y-4">
                {parameters.map((param, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium font-mono text-sm">{param.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {param.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {param.type}
                        </Badge>
                        {param.required && (
                          <Badge variant="default" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {tool.implementation && (
          <Card>
            <CardHeader>
              <CardTitle>Implementation Details</CardTitle>
              <CardDescription>
                Configuration for tool execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(tool.implementation, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}