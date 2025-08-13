import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' },
      ],
    })
    
    return NextResponse.json(tools)
  } catch (error) {
    console.error('Failed to fetch tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const tool = await prisma.tool.create({
      data: body,
    })
    
    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error('Failed to create tool:', error)
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    )
  }
}