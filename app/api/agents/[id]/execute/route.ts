import { NextRequest, NextResponse } from 'next/server'
import { runAgent, streamAgent } from '@/lib/jaf/runner'

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
    
    if (streaming) {
      // Return a streaming response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamAgent(id, input, { apiKey, baseURL })) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            console.error('[API:EXECUTE] Streaming error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            )
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
      const result = await runAgent(id, input, { apiKey, baseURL })
      
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('[API:EXECUTE] Error:', error)
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Return last execution or agent info
    // This is a placeholder - implement based on your needs
    return NextResponse.json({
      agentId: id,
      status: 'ready',
      message: 'Use POST to execute the agent'
    })
  } catch (error) {
    console.error('[API:EXECUTE] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}