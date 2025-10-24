import { NextRequest, NextResponse } from 'next/server'
import publishingData from '@/lib/data/publishing.json'

let publishing = [...publishingData]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const item = publishing.find(p => p.id === id)

    if (!item) {
      return NextResponse.json(
        { error: 'Publishing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch publishing' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const index = publishing.findIndex(p => p.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Publishing not found' },
        { status: 404 }
      )
    }

    const oldStatus = publishing[index].status
    const newStatus = body.status

    // Add history entry if status changed
    if (newStatus && newStatus !== oldStatus) {
      publishing[index].history.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        actor: body.actor || 'user_001',
      })

      // Update published_at if status is published
      if (newStatus === 'published') {
        publishing[index].published_at = new Date().toISOString()
        publishing[index].published_by = body.actor || 'user_001'
      }
    }

    publishing[index] = {
      ...publishing[index],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      data: publishing[index],
      message: 'Publishing updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update publishing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const index = publishing.findIndex(p => p.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Publishing not found' },
        { status: 404 }
      )
    }

    const deleted = publishing.splice(index, 1)[0]

    return NextResponse.json({
      data: deleted,
      message: 'Publishing deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete publishing' },
      { status: 500 }
    )
  }
}

