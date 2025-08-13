import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { agentSchema } from '@/lib/types'

const prisma = new PrismaClient()

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
    
    return NextResponse.json(agents)
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