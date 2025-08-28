import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { agentSchema } from '@/lib/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        knowledgeSources: true,
      },
    })
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Ensure arrays are properly formatted
    const responseData = {
      ...agent,
      tools: agent.tools || [],
      capabilities: agent.capabilities || [],
      knowledgeSources: agent.knowledgeSources || []
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Update agent and replace knowledge sources transactionally
    const result = await prisma.$transaction(async (tx) => {
      const agent = await tx.agent.update({
        where: { id },
        data: {
          ...validated,
          instructions: validated.instructions ?? validated.systemPrompt ?? '',
        },
      })

      // Replace knowledge sources if provided; if empty array provided, clear
      if (Array.isArray(body.knowledgeSources)) {
        await tx.knowledgeSource.deleteMany({ where: { agentId: id } })
        if (knowledgeSources.length > 0) {
          await tx.knowledgeSource.createMany({
            data: knowledgeSources.map(ks => ({
              agentId: id,
              type: ks.type,
              name: ks.name,
              source: ks.source,
              settings: ks.settings as unknown as object | undefined,
            }))
          })
        }
      }

      return agent
    })

    const fullAgent = await prisma.agent.findUnique({
      where: { id: result.id },
      include: { knowledgeSources: true },
    })

    return NextResponse.json(fullAgent)
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.agent.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
