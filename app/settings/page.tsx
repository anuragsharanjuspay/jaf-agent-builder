'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

interface APIKeys {
  openai?: string
  anthropic?: string
  google?: string
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<APIKeys>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load API keys from localStorage
    const storedKeys = localStorage.getItem('apiKeys')
    if (storedKeys) {
      try {
        setApiKeys(JSON.parse(storedKeys))
      } catch (error) {
        console.error('Failed to load API keys:', error)
      }
    }
  }, [])

  const handleSave = () => {
    // Save API keys to localStorage
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['GPT-4', 'GPT-4 Turbo', 'GPT-3.5 Turbo'],
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
      placeholder: 'sk-ant-...',
      helpUrl: 'https://console.anthropic.com/api',
    },
    {
      id: 'google',
      name: 'Google',
      models: ['Gemini Pro', 'Gemini 2.0 Flash'],
      placeholder: 'AIza...',
      helpUrl: 'https://makersuite.google.com/app/apikey',
    },
  ]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API keys and preferences
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Provider API Keys</CardTitle>
              <CardDescription>
                Configure API keys for different AI model providers. Keys are stored locally in your browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {providers.map((provider) => (
                <div key={provider.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <div className="flex gap-2 mt-1">
                        {provider.models.map((model) => (
                          <Badge key={model} variant="secondary" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <a
                      href={provider.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Get API Key →
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        placeholder={provider.placeholder}
                        value={apiKeys[provider.id as keyof APIKeys] || ''}
                        onChange={(e) =>
                          setApiKeys(prev => ({
                            ...prev,
                            [provider.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => toggleShowKey(provider.id)}
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {apiKeys[provider.id as keyof APIKeys] && (
                      <Badge variant="outline" className="self-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  API keys are stored locally in your browser and never sent to our servers
                </p>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Keys
                </Button>
              </div>

              {saved && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  API keys saved successfully
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>API keys are required to run agents with their respective models.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>You can also provide API keys directly in the playground for one-time use.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Be careful with API usage as you will be charged by the respective providers.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Preference settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}