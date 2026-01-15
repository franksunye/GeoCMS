import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStorageUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        const category = searchParams.get('category')
        const limit = parseInt(searchParams.get('limit') || '5')

        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 })
        }

        // 获取该分类的问题样本
        const questions = await prisma.faqQuestion.findMany({
            where: { category },
            take: limit,
            orderBy: { createdAt: 'desc' }
        })

        // 获取关联的 Call 信息（优先从 Call 获取音频）
        const callIds = questions.map(q => q.callId).filter(Boolean) as string[]
        const calls = await prisma.call.findMany({
            where: { id: { in: callIds } },
            select: {
                id: true,
                audioUrl: true,
                agent: {
                    select: { name: true }
                }
            }
        })
        const callMap = new Map(calls.map(c => [c.id, c]))

        // 获取关联的 Deal 信息（获取 leakArea 和 fallback 音频）
        const dealIds = [...new Set(questions.map(q => q.dealId))]
        const deals = await prisma.deal.findMany({
            where: { id: { in: dealIds } },
            select: {
                id: true,
                leakArea: true,
                transcripts: {
                    select: {
                        audioUrl: true
                    },
                    take: 1
                }
            }
        })

        const dealMap = new Map(deals.map(d => [d.id, d]))

        const samples = questions.map(q => {
            const deal = dealMap.get(q.dealId)
            const call = q.callId ? callMap.get(q.callId) : null

            // 优先使用 Call 的音频，否则回退到 Transcript
            let audioUrl = call?.audioUrl
            if (!audioUrl) {
                audioUrl = deal?.transcripts?.[0]?.audioUrl || null
            }

            return {
                id: q.id,
                question: q.question,
                dealId: q.dealId,
                callId: q.callId,
                timestamp: q.timestamp ? Number(q.timestamp) : null, // 毫秒 BigInt -> Number
                audioUrl: getStorageUrl(audioUrl),
                agentName: call?.agent?.name || null,
                leakArea: deal?.leakArea || null
            }
        })

        return NextResponse.json({ samples })
    } catch (error) {
        console.error('FAQ samples error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
