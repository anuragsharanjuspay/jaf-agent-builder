import { AgentList } from '@/components/agents/agent-list'
import { prisma } from '@/lib/db'

export default async function AgentsPage() {
  // Fetch agents from database
  // TODO: Replace with proper user authentication
  const userId = 'temp-user-id'
  
  const agents = await prisma.agent.findMany({
    where: { userId },
    include: {
      knowledgeSources: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
  
  // Ensure arrays are properly formatted and types are correct
  const formattedAgents = agents.map(agent => ({
    ...agent,
    tools: agent.tools || [],
    capabilities: agent.capabilities || [],
    knowledgeSources: (agent.knowledgeSources || []).map(ks => ({
      name: ks.name,
      type: ks.type as 'document' | 'url' | 'api',
      source: ks.source,
      settings: (ks.settings || undefined) as Record<string, unknown> | undefined
    })),
    config: (agent.config || undefined) as Record<string, unknown> | undefined
  }))

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">
          Create and manage your AI agents
        </p>
      </div>
      <AgentList agents={formattedAgents} />
    </div>
  )
}