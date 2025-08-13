import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { agentConfigToJAF, exportAgentAsJSON } from '@/lib/jaf-transformer'
import { Agent, Tool } from '@/lib/types'

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
    const prismaTools = await prisma.tool.findMany({
      where: {
        id: { in: agent.tools },
      },
    })
    
    // Convert Prisma tools to our Tool type
    const tools: Tool[] = prismaTools.map(tool => ({
      ...tool,
      parameters: tool.parameters as Tool['parameters'],
      implementation: tool.implementation as Record<string, unknown> | undefined,
    }))
    
    // Convert Prisma agent to our Agent type
    const agentData: Agent = {
      ...agent,
      config: agent.config as Record<string, unknown> | undefined,
      knowledgeSources: agent.knowledgeSources.map(ks => ({
        type: ks.type as 'document' | 'url' | 'api',
        name: ks.name,
        source: ks.source,
        settings: ks.settings as Record<string, unknown> | undefined,
      })),
    }
    
    if (format === 'json') {
      // Export as JSON
      const jsonContent = exportAgentAsJSON(agentData)
      return new Response(jsonContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}.json"`,
        },
      })
    } else {
      // Export as JAF TypeScript code
      const jafCode = agentConfigToJAF(agentData, tools)
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