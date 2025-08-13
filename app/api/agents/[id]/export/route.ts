import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { agentConfigToJAF, exportAgentAsJSON } from '@/lib/jaf-transformer'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'jaf'
    
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
    
    // Get tools for the agent
    const tools = await prisma.tool.findMany({
      where: {
        id: { in: agent.tools },
      },
    })
    
    if (format === 'json') {
      // Export as JSON
      const jsonContent = exportAgentAsJSON(agent)
      return new Response(jsonContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}.json"`,
        },
      })
    } else {
      // Export as JAF TypeScript code
      const jafCode = agentConfigToJAF(agent, tools)
      return new Response(jafCode, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}.ts"`,
        },
      })
    }
  } catch (error) {
    console.error('Failed to export agent:', error)
    return NextResponse.json(
      { error: 'Failed to export agent' },
      { status: 500 }
    )
  }
}