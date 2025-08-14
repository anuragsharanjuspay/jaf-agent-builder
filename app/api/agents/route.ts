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
    
    // Validate input
    const validated = agentSchema.parse(body)
    
    // TODO: Get user from session
    const userId = 'temp-user-id'
    
    const agent = await prisma.agent.create({
      data: {
        ...validated,
        userId,
      },
    })
    
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}