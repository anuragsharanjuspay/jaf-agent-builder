import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Code, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          JAF Agent Builder
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Build powerful AI agents with no code using the Juspay Agent Framework
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/agents">
            <Button size="lg">View Agents</Button>
          </Link>
          <Link href="/agents/new">
            <Button size="lg" variant="outline">Create New Agent</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <Card>
          <CardHeader>
            <Bot className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Visual Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure agents through intuitive forms without writing code
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Code className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>JAF Export</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Export your agents as production-ready JAF TypeScript code
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Tool Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Connect your agents with powerful tools and APIs
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Type Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Built on JAF's functional, type-safe foundation
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}