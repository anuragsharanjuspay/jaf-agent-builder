'use client'

import { useState } from 'react'
import { Tool, TOOL_CATEGORIES } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Search } from 'lucide-react'

interface ToolSelectorProps {
  tools: Tool[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function ToolSelector({ tools, selected, onChange }: ToolSelectorProps) {
  const [search, setSearch] = useState('')

  const toggleTool = (toolId: string) => {
    if (selected.includes(toolId)) {
      onChange(selected.filter(id => id !== toolId))
    } else {
      onChange([...selected, toolId])
    }
  }

  const filteredTools = tools.filter(tool => 
    tool.displayName.toLowerCase().includes(search.toLowerCase()) ||
    tool.description?.toLowerCase().includes(search.toLowerCase())
  )

  const toolsByCategory = TOOL_CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredTools.filter(tool => tool.category === category)
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue={TOOL_CATEGORIES[0]} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 h-auto">
          {TOOL_CATEGORIES.map(category => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {TOOL_CATEGORIES.map(category => (
          <TabsContent key={category} value={category} className="space-y-2">
            {toolsByCategory[category]?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tools found in this category
              </p>
            ) : (
              <div className="grid gap-2">
                {toolsByCategory[category]?.map(tool => (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.includes(tool.id) 
                        ? 'bg-primary/5 border-primary' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tool.displayName}</span>
                          {tool.isBuiltin && (
                            <Badge variant="secondary" className="text-xs">
                              Built-in
                            </Badge>
                          )}
                        </div>
                        {tool.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tool.description}
                          </p>
                        )}
                      </div>
                      {selected.includes(tool.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-wrap gap-2">
        {selected.map(toolId => {
          const tool = tools.find(t => t.id === toolId)
          if (!tool) return null
          return (
            <Badge key={toolId} variant="secondary">
              {tool.displayName}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}