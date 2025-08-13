import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { runAgent, streamAgent } from '@/lib/jaf-runner'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { input, apiKey, baseURL, streaming = false } = body
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      )
    }
    
    // Fetch the agent
    const agent = await prisma.agent.findUnique({
      where: { id },
    })
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Create execution record
    const execution = await prisma.agentExecution.create({
      data: {
        agentId: id,
        input,
        status: 'running',
      },
    })
    
    try {
      // Convert Prisma agent to the format expected by streamAgent
      const agentForRunner = {
        ...agent,
        config: agent.config as Record<string, unknown> | undefined
      }
      
      if (streaming) {
        // Return a streaming response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamAgent(agentForRunner, input, { apiKey, baseURL })) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
              }
              
              // Update execution record
              await prisma.agentExecution.update({
                where: { id: execution.id },
                data: {
                  status: 'completed',
                  completedAt: new Date(),
                },
              })
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
              controller.close()
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              
              await prisma.agentExecution.update({
                where: { id: execution.id },
                data: {
                  status: 'failed',
                  error: errorMessage,
                  completedAt: new Date(),
                },
              })
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
              controller.close()
            }
          },
        })
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } else {
        // Non-streaming response
        const startTime = Date.now()
        const output = await runAgent(agentForRunner, input, { apiKey, baseURL })
        const durationMs = Date.now() - startTime
        
        // Update execution record
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            output,
            status: 'completed',
            durationMs,
            completedAt: new Date(),
          },
        })
        
        return NextResponse.json({
          executionId: execution.id,
          output,
          durationMs,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Update execution record with error
      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date(),
        },
      })
      
      throw error
    }
  } catch (error) {
    console.error('Failed to execute agent:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to execute agent'
    
    // Check if it's an API key error
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Please provide a valid API key for the selected model.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Get execution history for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const executions = await prisma.agentExecution.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 executions
    })
    
    return NextResponse.json(executions)
  } catch (error) {
    console.error('Failed to fetch execution history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    )
  }
}