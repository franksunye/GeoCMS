import { NextRequest, NextResponse } from 'next/server'
import mediaData from '@/lib/data/media.json'

let media = [...mediaData]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const item = media.find(m => m.id === id)

    if (!item) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const index = media.findIndex(m => m.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    media[index] = {
      ...media[index],
      ...body,
    }

    return NextResponse.json({
      data: media[index],
      message: 'Media updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update media' },
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
    const index = media.findIndex(m => m.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    const deleted = media.splice(index, 1)[0]

    return NextResponse.json({
      data: deleted,
      message: 'Media deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}

