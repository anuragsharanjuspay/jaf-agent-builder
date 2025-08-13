'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { FileText, Globe, Zap, Plus, X } from 'lucide-react'
import { KnowledgeSource } from '@/lib/types'

interface KnowledgeManagerProps {
  sources?: KnowledgeSource[]
  onChange?: (sources: KnowledgeSource[]) => void
}

export function KnowledgeManager({ sources = [], onChange }: KnowledgeManagerProps) {
  const [localSources, setLocalSources] = useState<KnowledgeSource[]>(sources)
  const [newSource, setNewSource] = useState<Partial<KnowledgeSource>>({
    type: 'document',
    name: '',
    source: '',
  })

  const addSource = () => {
    if (newSource.name && newSource.source && newSource.type) {
      const source: KnowledgeSource = {
        type: newSource.type as 'document' | 'url' | 'api',
        name: newSource.name,
        source: newSource.source,
      }
      const updated = [...localSources, source]
      setLocalSources(updated)
      onChange?.(updated)
      setNewSource({ type: 'document', name: '', source: '' })
    }
  }

  const removeSource = (index: number) => {
    const updated = localSources.filter((_, i) => i !== index)
    setLocalSources(updated)
    onChange?.(updated)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'url':
        return <Globe className="h-4 w-4" />
      case 'api':
        return <Zap className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {localSources.map((source, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getIcon(source.type)}
                <div>
                  <p className="font-medium text-sm">{source.name}</p>
                  <p className="text-xs text-muted-foreground">{source.source}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSource(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="grid gap-3">
          <div>
            <Label htmlFor="source-type">Type</Label>
            <Select
              value={newSource.type}
              onValueChange={(value) => setNewSource({ ...newSource, type: value as 'document' | 'url' | 'api' })}
            >
              <SelectTrigger id="source-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source-name">Name</Label>
            <Input
              id="source-name"
              placeholder="e.g., Product Documentation"
              value={newSource.name || ''}
              onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="source-location">
              {newSource.type === 'document' ? 'File Path' : 
               newSource.type === 'url' ? 'URL' : 'Endpoint'}
            </Label>
            <Input
              id="source-location"
              placeholder={
                newSource.type === 'document' ? '/path/to/document.pdf' :
                newSource.type === 'url' ? 'https://example.com/docs' :
                'https://api.example.com/v1/data'
              }
              value={newSource.source || ''}
              onChange={(e) => setNewSource({ ...newSource, source: e.target.value })}
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addSource}
          disabled={!newSource.name || !newSource.source}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Knowledge Source
        </Button>
      </div>
    </div>
  )
}