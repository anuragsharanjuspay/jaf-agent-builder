import { AgentList } from '@/components/agents/agent-list'
import { Agent } from '@/lib/types'

// Mock data for now - will be replaced with actual API call
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries and support tickets',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful customer support agent...',
    tools: ['search', 'calculator'],
    capabilities: ['chat', 'search'],
    status: 'active',
    userId: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Data Analysis Agent',
    description: 'Analyzes data and generates insights',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a data analysis expert...',
    tools: ['calculator', 'chart'],
    capabilities: ['analysis', 'visualization'],
    status: 'draft',
    userId: 'user1',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
]

export default async function AgentsPage() {
  // TODO: Fetch agents from API
  // const agents = await fetch('/api/agents').then(res => res.json())
  const agents = mockAgents

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">
          Create and manage your AI agents
        </p>
      </div>
      <AgentList agents={agents} />
    </div>
  )
}