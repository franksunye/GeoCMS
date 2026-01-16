import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const [tags, signals] = await Promise.all([
            prisma.tag.findMany({
                select: { category: true, dimension: true, polarity: true }
            }),
            prisma.signal.findMany({
                select: { category: true, dimension: true }
            })
        ])

        const categories = Array.from(new Set([
            ...tags.map(t => t.category),
            ...signals.map(s => s.category)
        ])).filter(Boolean).sort()

        const dimensions = Array.from(new Set([
            ...tags.map(t => t.dimension),
            ...signals.map(s => s.dimension)
        ])).filter(Boolean).sort()

        const polarities = Array.from(new Set(
            tags.map(t => t.polarity)
        )).filter(Boolean).sort()

        return NextResponse.json({
            categories,
            dimensions,
            polarities
        })
    } catch (error) {
        console.error('Database Error:', error)
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
    }
}
