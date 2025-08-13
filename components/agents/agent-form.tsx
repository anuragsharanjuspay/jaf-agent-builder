'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AgentConfig, agentSchema, AVAILABLE_MODELS, Tool } from '@/lib/types'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToolSelector } from './tool-selector'
import { KnowledgeManager } from './knowledge-manager'

interface AgentFormProps {
  agent?: AgentConfig
  tools?: Tool[]
  onSubmit: (data: AgentConfig) => Promise<void>
}

export function AgentForm({ agent, tools = [], onSubmit }: AgentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AgentConfig>({
    resolver: zodResolver(agentSchema),
    defaultValues: agent || {
      name: '',
      description: '',
      model: 'gpt-4',
      systemPrompt: '',
      tools: [],
      capabilities: [],
      status: 'draft',
    },
  })

  const handleSubmit = async (data: AgentConfig) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic settings for your agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer Support Agent" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique name to identify your agent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This agent helps customers with product inquiries and support issues..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what this agent does
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The AI model that powers this agent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              Define the agent's behavior and personality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="You are a helpful assistant that specializes in customer support. You should be friendly, professional, and always try to help users solve their problems..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This prompt defines how your agent behaves and responds
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tools & Capabilities</CardTitle>
            <CardDescription>
              Select tools and define capabilities for your agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToolSelector
              tools={tools}
              selected={form.watch('tools')}
              onChange={(tools) => form.setValue('tools', tools)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Sources</CardTitle>
            <CardDescription>
              Add documents, URLs, or APIs for your agent to reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeManager />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Agent'}
          </Button>
        </div>
      </form>
    </Form>
  )
}