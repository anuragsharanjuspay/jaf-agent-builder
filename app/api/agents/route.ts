import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { agentSchema } from '@/lib/types'

export async function GET() {
  try {
    // TODO: Get user from session
    const userId = 'temp-user-id'
    
    const agents = await prisma.agent.findMany({
      where: { userId },
      include: {
        knowledgeSources: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    // Ensure arrays are properly formatted in each agent
    const formattedAgents = agents.map((agent: {
      tools: string[]
      capabilities: string[]
      knowledgeSources: unknown[]
      [key: string]: unknown
    }) => ({
      ...agent,
      tools: agent.tools || [],
      capabilities: agent.capabilities || [],
      knowledgeSources: agent.knowledgeSources || []
    }))
    
    return NextResponse.json(formattedAgents)
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract optional knowledge sources before validation (not in agentSchema)
    const knowledgeSources = Array.isArray(body.knowledgeSources)
      ? body.knowledgeSources as Array<{
          type: 'document' | 'url' | 'api'
          name: string
          source: string
          settings?: Record<string, unknown>
        }>
      : []

    // Validate base agent fields
    const validated = agentSchema.parse(body)

    // TODO: Get user from session
    const userId = 'temp-user-id'

    // Create agent then attach knowledge sources
    const agent = await prisma.agent.create({
      data: {
        ...validated,
        // Ensure instructions fallback to systemPrompt if not provided
        instructions: validated.instructions ?? validated.systemPrompt ?? '',
        userId,
      },
    })

    if (knowledgeSources.length > 0) {
      await prisma.knowledgeSource.createMany({
        data: knowledgeSources.map(ks => ({
          agentId: agent.id,
          type: ks.type,
          name: ks.name,
          source: ks.source,
          settings: ks.settings as unknown as object | undefined,
        }))
      })
    }

    const fullAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: { knowledgeSources: true },
    })

    return NextResponse.json(fullAgent, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
