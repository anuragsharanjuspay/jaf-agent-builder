'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Agent } from '@/lib/types'
import Link from 'next/link'

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'archived':
        return 'bg-gray-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <Badge className={getStatusColor(agent.status)} variant="secondary">
            {agent.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {agent.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Model:</span> {agent.model}
          </div>
          <div>
            <span className="font-medium">Tools:</span> {agent.tools.length || 0}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {new Date(agent.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link href={`/agents/${agent.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Edit
          </Button>
        </Link>
        <Link href={`/agents/${agent.id}/test`} className="flex-1">
          <Button className="w-full">Test</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}