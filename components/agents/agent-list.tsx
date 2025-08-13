'use client'

import { Agent } from '@/lib/types'
import { AgentCard } from './agent-card'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface AgentListProps {
  agents: Agent[]
}

export function AgentList({ agents }: AgentListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
      <Link href="/agents/new">
        <Card className="h-full min-h-[200px] flex items-center justify-center hover:bg-accent cursor-pointer transition-colors">
          <div className="text-center">
            <Plus className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Create New Agent</p>
          </div>
        </Card>
      </Link>
    </div>
  )
}