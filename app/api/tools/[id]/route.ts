import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const tool = await prisma.tool.findUnique({
      where: { id },
    })
    
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(tool)
  } catch (error) {
    console.error('Failed to fetch tool:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
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
    
    // Don't allow editing built-in tools
    const existingTool = await prisma.tool.findUnique({
      where: { id },
    })
    
    if (!existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    if (existingTool.isBuiltin) {
      return NextResponse.json(
        { error: 'Cannot modify built-in tools' },
        { status: 403 }
      )
    }
    
    const tool = await prisma.tool.update({
      where: { id },
      data: body,
    })
    
    return NextResponse.json(tool)
  } catch (error) {
    console.error('Failed to update tool:', error)
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Don't allow deleting built-in tools
    const existingTool = await prisma.tool.findUnique({
      where: { id },
    })
    
    if (!existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    if (existingTool.isBuiltin) {
      return NextResponse.json(
        { error: 'Cannot delete built-in tools' },
        { status: 403 }
      )
    }
    
    await prisma.tool.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete tool:', error)
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    )
  }
}