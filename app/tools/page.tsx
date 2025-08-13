'use client'

import { useState, useEffect } from 'react'
import { Tool, TOOL_CATEGORIES } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Code, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ToolsPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
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

  const filteredTools = tools.filter(tool => 
    tool.displayName.toLowerCase().includes(search.toLowerCase()) ||
    tool.description?.toLowerCase().includes(search.toLowerCase()) ||
    tool.category.toLowerCase().includes(search.toLowerCase())
  )

  const toolsByCategory = TOOL_CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredTools.filter(tool => tool.category === category)
    return acc
  }, {} as Record<string, Tool[]>)

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tools Library</h1>
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tools Library</h1>
          <p className="text-muted-foreground">
            Manage and configure tools available for your agents
          </p>
        </div>
        <Button onClick={() => router.push('/tools/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Total: {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          {filteredTools.filter(t => t.isBuiltin).length > 0 && (
            <Badge variant="secondary">
              {filteredTools.filter(t => t.isBuiltin).length} Built-in
            </Badge>
          )}
          {filteredTools.filter(t => !t.isBuiltin).length > 0 && (
            <Badge variant="outline">
              {filteredTools.filter(t => !t.isBuiltin).length} Custom
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-8 w-full h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {TOOL_CATEGORIES.map(category => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        {TOOL_CATEGORIES.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            {toolsByCategory[category]?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No tools found in {category} category</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/tools/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {category} Tool
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {toolsByCategory[category]?.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ToolCard({ tool }: { tool: Tool }) {
  const router = useRouter()
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/tools/${tool.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-4 w-4" />
              {tool.displayName}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {tool.category}
              </Badge>
              {tool.isBuiltin && (
                <Badge variant="secondary" className="text-xs">
                  Built-in
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/tools/${tool.id}/edit`)
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tool.description && (
          <CardDescription className="line-clamp-2">
            {tool.description}
          </CardDescription>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          {Array.isArray(tool.parameters) && (
            <span>{tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}