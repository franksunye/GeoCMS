import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const leakArea = searchParams.get('leakArea')

        // 构建查询条件
        const where: Record<string, unknown> = {}

        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            }
        }

        // 获取问题统计
        const questions = await prisma.faqQuestion.findMany({
            where,
            select: {
                category: true,
                dealId: true
            }
        })

        // 如果需要按部位筛选，获取相关的 deal
        let filteredQuestions = questions
        if (leakArea) {
            const leakAreas = leakArea.split(',')
            const deals = await prisma.deal.findMany({
                where: {
                    id: { in: questions.map(q => q.dealId) }
                },
                select: {
                    id: true,
                    leakArea: true
                }
            })

            const dealLeakAreaMap = new Map(deals.map(d => [d.id, d.leakArea]))
            filteredQuestions = questions.filter(q => {
                const dealLeakArea = dealLeakAreaMap.get(q.dealId)
                if (!dealLeakArea) return false
                try {
                    const areas = JSON.parse(dealLeakArea)
                    return leakAreas.some(la => areas.includes(la))
                } catch {
                    return false
                }
            })
        }

        // 统计分类
        const categoryCount: Record<string, number> = {}
        const dealIds = new Set<string>()

        for (const q of filteredQuestions) {
            const category = q.category || '其他'
            categoryCount[category] = (categoryCount[category] || 0) + 1
            dealIds.add(q.dealId)
        }

        // 排序：先按数量降序，然后强制将 "其他" 放到最后
        const ranking = Object.entries(categoryCount)
            .map(([category, count]) => ({
                category,
                count,
                percentage: Math.round((count / filteredQuestions.length) * 1000) / 10
            }))
            .sort((a, b) => {
                // "其他" 始终排在最后
                if (a.category === '其他') return 1
                if (b.category === '其他') return -1
                // 其他情况按数量降序
                return b.count - a.count
            })

        return NextResponse.json({
            summary: {
                totalCalls: dealIds.size,
                totalQuestions: filteredQuestions.length,
                avgQuestionsPerCall: dealIds.size > 0
                    ? Math.round((filteredQuestions.length / dealIds.size) * 10) / 10
                    : 0
            },
            ranking
        })
    } catch (error) {
        console.error('FAQ stats error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
