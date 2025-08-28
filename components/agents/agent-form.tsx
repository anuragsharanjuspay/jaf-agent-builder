'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AgentConfig, AVAILABLE_MODELS, Tool, KnowledgeSource } from '@/lib/types'
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

// Form-specific schema
const agentFormSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  description: z.string().optional(),
  model: z.string().min(1, "Model selection is required"),
  instructions: z.string().min(1, "Instructions are required"),
  tools: z.array(z.string()),
  capabilities: z.array(z.string()),
  status: z.enum(['draft', 'active', 'archived']),
  // Advanced (form-only inputs)
  handoffsInput: z.string().optional(),
  modelTemperature: z.union([z.number(), z.string()]).optional(),
  modelMaxTokens: z.union([z.number(), z.string()]).optional(),
  outputSchemaText: z.string().optional(),
  memoryType: z.string().optional(),
  memoryConfigText: z.string().optional(),
  inputGuardrailsText: z.string().optional(),
  outputGuardrailsText: z.string().optional(),
})

type AgentFormData = z.infer<typeof agentFormSchema>

interface AgentFormProps {
  agent?: AgentConfig
  tools?: Tool[]
  initialKnowledgeSources?: KnowledgeSource[]
  onSubmit: (data: AgentConfig) => Promise<void>
}

export function AgentForm({ agent, tools = [], initialKnowledgeSources = [], onSubmit }: AgentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(initialKnowledgeSources)

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: (agent
      ? { ...agent, instructions: (agent as any).instructions || (agent as any).systemPrompt || '' }
      : undefined) || {
      name: '',
      description: '',
      model: 'gpt-4',
      instructions: '',
      tools: [],
      capabilities: [],
      status: 'draft',
      // Advanced defaults
      handoffsInput: '',
      modelTemperature: '',
      modelMaxTokens: '',
      outputSchemaText: '',
      memoryType: '',
      memoryConfigText: '',
      inputGuardrailsText: '',
      outputGuardrailsText: '',
    },
  })

  const handleSubmit = async (data: AgentFormData) => {
    // Build advanced fields
    const handoffs = (data.handoffsInput || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const modelConfig: Record<string, unknown> = {}
    const temperatureNum = typeof data.modelTemperature === 'string' ? parseFloat(data.modelTemperature) : data.modelTemperature
    const maxTokensNum = typeof data.modelMaxTokens === 'string' ? parseInt(data.modelMaxTokens as string, 10) : data.modelMaxTokens
    if (!Number.isNaN(temperatureNum as number) && temperatureNum !== undefined) modelConfig.temperature = temperatureNum
    if (!Number.isNaN(maxTokensNum as number) && maxTokensNum !== undefined) modelConfig.maxTokens = maxTokensNum

    const parseJson = (text?: string) => {
      if (!text) return undefined
      try { return JSON.parse(text) } catch { return text }
    }

    const agentData: AgentConfig = {
      name: data.name,
      description: data.description,
      model: data.model,
      systemPrompt: data.instructions, // keep legacy field in sync
      tools: data.tools,
      capabilities: data.capabilities,
      status: data.status,
      // Advanced
      instructions: data.instructions,
      handoffs: handoffs.length ? handoffs : undefined,
      modelConfig: Object.keys(modelConfig).length ? modelConfig : undefined,
      outputSchema: parseJson(data.outputSchemaText),
      memoryType: data.memoryType && data.memoryType !== 'none' ? data.memoryType : undefined,
      memoryConfig: parseJson(data.memoryConfigText),
      inputGuardrails: parseJson(data.inputGuardrailsText),
      outputGuardrails: parseJson(data.outputGuardrailsText),
    } as AgentConfig

    setIsSubmitting(true)
    try {
      // include knowledge sources in payload
      await onSubmit({ ...agentData, knowledgeSources } as unknown as AgentConfig)
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
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              Define the agent&apos;s behavior and personality (used by JAF)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="You are a helpful assistant..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These instructions are sent to JAF and used at runtime
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
            <KnowledgeManager 
              sources={knowledgeSources}
              onChange={setKnowledgeSources}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings (Optional)</CardTitle>
            <CardDescription>
              JAF-specific configuration: instructions, handoffs, model config, schemas, memory, guardrails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* No duplicate instructions field. Single source of truth above. */}

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="handoffsInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handoffs (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="agent-a, agent-b" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memoryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select memory type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="in-memory">In-memory</SelectItem>
                        <SelectItem value="redis">Redis</SelectItem>
                        <SelectItem value="postgres">Postgres</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modelTemperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 0.7" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modelMaxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2000" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="outputSchemaText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Schema (JSON)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px] font-mono text-xs" placeholder='{"type":"object","properties":{}}' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memoryConfigText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memory Config (JSON)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px] font-mono text-xs" placeholder='{"url":"redis://localhost:6379"}' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inputGuardrailsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input Guardrails (JSON)</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px] font-mono text-xs" placeholder='[{"type":"regex","config":{}}]' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outputGuardrailsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Guardrails (JSON)</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px] font-mono text-xs" placeholder='[{"type":"json-schema","config":{}}]' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => window.history.back()}
          >
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
