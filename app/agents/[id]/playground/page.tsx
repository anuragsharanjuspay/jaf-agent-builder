'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Agent } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Send, Settings, Loader2, AlertCircle, Check, Clock } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  error?: boolean
}

interface Execution {
  id: string
  input: string
  output?: string
  status: string
  error?: string
  createdAt: string
  completedAt?: string
  durationMs?: number
}

export default function AgentPlaygroundPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [executions, setExecutions] = useState<Execution[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load API keys from localStorage
    const storedKeys = localStorage.getItem('apiKeys')
    if (storedKeys) {
      try {
        const keys = JSON.parse(storedKeys)
        // Determine which key to use based on model
        if (agent?.model.includes('gpt')) {
          setApiKey(keys.openai || '')
        } else if (agent?.model.includes('claude')) {
          setApiKey(keys.anthropic || '')
        } else if (agent?.model.includes('gemini')) {
          setApiKey(keys.google || '')
        }
      } catch (error) {
        console.error('Failed to load API keys:', error)
      }
    }
  }, [agent?.model])

  useEffect(() => {
    // Fetch agent details
    fetch(`/api/agents/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setAgent(data)
        setLoading(false)
        // Add system message
        setMessages([{
          id: '1',
          role: 'system',
          content: `Agent "${data.name}" is ready. ${data.description || ''}`,
          timestamp: new Date(),
        }])
      })
      .catch(error => {
        console.error('Failed to fetch agent:', error)
        setLoading(false)
      })
    
    // Fetch execution history
    fetch(`/api/agents/${resolvedParams.id}/execute`)
      .then(res => res.json())
      .then(data => {
        setExecutions(data)
      })
      .catch(error => {
        console.error('Failed to fetch executions:', error)
      })
  }, [resolvedParams.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)
    
    try {
      // Check if API key is needed
      const needsApiKey = agent?.model.includes('gpt') || agent?.model.includes('claude') || agent?.model.includes('gemini')
      if (needsApiKey && !apiKey) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Please provide an API key in the settings to use this model.',
          timestamp: new Date(),
          error: true,
        }
        setMessages(prev => [...prev, errorMessage])
        setSending(false)
        setShowSettings(true)
        return
      }
      
      const response = await fetch(`/api/agents/${resolvedParams.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
          apiKey: apiKey || undefined,
          streaming: false,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to execute agent')
      }
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: data.output,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Refresh execution history
      const executionsRes = await fetch(`/api/agents/${resolvedParams.id}/execute`)
      const executionsData = await executionsRes.json()
      setExecutions(executionsData)
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred',
        timestamp: new Date(),
        error: true,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading agent playground...</p>
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

  const modelProviderMap: Record<string, { name: string; keyPlaceholder: string }> = {
    'gpt-4': { name: 'OpenAI', keyPlaceholder: 'sk-...' },
    'gpt-4-turbo': { name: 'OpenAI', keyPlaceholder: 'sk-...' },
    'gpt-3.5-turbo': { name: 'OpenAI', keyPlaceholder: 'sk-...' },
    'claude-3-opus': { name: 'Anthropic', keyPlaceholder: 'sk-ant-...' },
    'claude-3-sonnet': { name: 'Anthropic', keyPlaceholder: 'sk-ant-...' },
    'claude-3-haiku': { name: 'Anthropic', keyPlaceholder: 'sk-ant-...' },
    'gemini-pro': { name: 'Google', keyPlaceholder: 'AIza...' },
    'gemini-2.0-flash': { name: 'Google', keyPlaceholder: 'AIza...' },
  }

  const provider = modelProviderMap[agent.model] || { name: 'Unknown', keyPlaceholder: 'API Key' }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/agents/${resolvedParams.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agent
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{agent.name} Playground</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{agent.model}</Badge>
              {agent.tools.length > 0 && (
                <Badge variant="secondary">{agent.tools.length} tools</Badge>
              )}
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                {agent.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription>
              Configure API settings for {provider.name} ({agent.model})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder={provider.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored locally and never saved on our servers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[500px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.role === 'system'
                          ? 'bg-muted text-muted-foreground italic'
                          : message.error
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-secondary'
                      }`}
                    >
                      {message.error && (
                        <AlertCircle className="h-4 w-4 inline-block mr-2" />
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !input.trim()}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Recent executions of this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No executions yet</p>
              ) : (
                <div className="space-y-4">
                  {executions.map((exec) => (
                    <div key={exec.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Input:</p>
                          <p className="text-sm text-muted-foreground">{exec.input}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {exec.status === 'completed' && (
                            <Badge variant="default">
                              <Check className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {exec.status === 'running' && (
                            <Badge variant="secondary">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Running
                            </Badge>
                          )}
                          {exec.status === 'failed' && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                      {exec.output && (
                        <div>
                          <p className="text-sm font-medium">Output:</p>
                          <p className="text-sm text-muted-foreground">{exec.output}</p>
                        </div>
                      )}
                      {exec.error && (
                        <div>
                          <p className="text-sm font-medium text-destructive">Error:</p>
                          <p className="text-sm text-destructive">{exec.error}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(exec.createdAt).toLocaleString()}</span>
                        {exec.durationMs && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exec.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                The instructions that define this agent&apos;s behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                {agent.systemPrompt}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}