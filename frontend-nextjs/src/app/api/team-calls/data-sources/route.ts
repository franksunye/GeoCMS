import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const dataSources = [
            // Sync Layer
            {
                id: 'sync-agents',
                name: '销售人员同步',
                description: '从外部系统同步的销售/坐席人员基础信息',
                tableName: 'sync_agents',
                type: 'sync',
                category: '同步层',
                timeField: 'created_at'
            },
            {
                id: 'sync-deals',
                name: '工单数据同步',
                description: '从外部系统同步的业务工单、成交结果等数据',
                tableName: 'sync_deals',
                type: 'sync',
                category: '同步层',
                timeField: 'created_at'
            },
            {
                id: 'sync-transcripts',
                name: '通话转录同步',
                description: '同步的原始通话录音文本及音频 URL',
                tableName: 'sync_transcripts',
                type: 'sync',
                category: '同步层',
                timeField: 'created_at'
            },
            {
                id: 'sync-ai-analysis',
                name: 'AI 分析录入',
                description: 'AI 模型生成的原始分析 JSON 数据',
                tableName: 'sync_ai_analysis',
                type: 'sync',
                category: '同步层',
                timeField: 'created_at'
            },
            {
                id: 'sync-contracts',
                name: '合同数据同步',
                description: '从外部系统同步的签约、成交合同信息',
                tableName: 'sync_contracts',
                type: 'sync',
                category: '同步层',
                timeField: 'createdAt'
            },

            // Biz Layer
            {
                id: 'biz-calls',
                name: '通话记录库',
                description: '经过 ETL 处理后的结构化通话业务记录',
                tableName: 'biz_calls',
                type: 'biz',
                category: '业务层',
                timeField: 'started_at'
            },
            {
                id: 'biz-call-tags',
                name: '标签打分库',
                description: '结构化的通话维度评分及上下文证据',
                tableName: 'biz_call_tags',
                type: 'biz',
                category: '业务层',
                timeField: 'created_at'
            },
            {
                id: 'biz-call-signals',
                name: '行为信号库',
                description: '检测到的关键行为事件及对应的时间戳',
                tableName: 'biz_call_signals',
                type: 'biz',
                category: '业务层',
                timeField: 'created_at'
            },

            // Config Layer
            {
                id: 'cfg-tags',
                name: '评分指标定义',
                description: '系统质检与评分维度的元数据配置',
                tableName: 'cfg_tags',
                type: 'cfg',
                category: '配置层',
                timeField: 'updated_at'
            },
            {
                id: 'cfg-signals',
                name: '信号触发定义',
                description: 'AI 检测行为信号的规则与逻辑定义',
                tableName: 'cfg_signals',
                type: 'cfg',
                category: '配置层',
                timeField: 'updated_at'
            },
            {
                id: 'cfg-scoring-rules',
                name: '计分逻辑规则',
                description: '从标签分转换到最终总分的计算规则',
                tableName: 'cfg_scoring_rules',
                type: 'cfg',
                category: '配置层',
                timeField: 'updated_at'
            },
            {
                id: 'cfg-prompts',
                name: 'AI 提示词模板',
                description: '用于驱动 AI 进行分析的 Prompt 模板库',
                tableName: 'cfg_prompts',
                type: 'cfg',
                category: '配置层',
                timeField: 'updated_at'
            }
        ]

        // Fetch counts and time ranges for all tables
        const results = await Promise.all(
            dataSources.map(async (source) => {
                try {
                    let count = 0
                    let oldestRecord: string | null = null
                    let latestRecord: string | null = null

                    switch (source.tableName) {
                        case 'sync_agents': {
                            count = await prisma.agent.count()
                            const oldest = await prisma.agent.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.agent.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'sync_deals': {
                            count = await prisma.deal.count()
                            const oldest = await prisma.deal.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.deal.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'sync_transcripts': {
                            count = await prisma.transcript.count()
                            const oldest = await prisma.transcript.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.transcript.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'sync_ai_analysis': {
                            count = await prisma.aIAnalysisLog.count()
                            const oldest = await prisma.aIAnalysisLog.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.aIAnalysisLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'sync_contracts': {
                            count = await prisma.contract.count()
                            const oldest = await prisma.contract.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.contract.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'biz_calls': {
                            count = await prisma.call.count()
                            const oldest = await prisma.call.findFirst({ orderBy: { startedAt: 'asc' }, select: { startedAt: true } })
                            const latest = await prisma.call.findFirst({ orderBy: { startedAt: 'desc' }, select: { startedAt: true } })
                            oldestRecord = oldest?.startedAt || null
                            latestRecord = latest?.startedAt || null
                            break
                        }
                        case 'biz_call_tags': {
                            count = await prisma.callTag.count()
                            const oldest = await prisma.callTag.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.callTag.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'biz_call_signals': {
                            count = await prisma.callSignal.count()
                            const oldest = await prisma.callSignal.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.callSignal.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.createdAt || null
                            break
                        }
                        case 'cfg_tags': {
                            count = await prisma.tag.count()
                            const oldest = await prisma.tag.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.tag.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.updatedAt || null
                            break
                        }
                        case 'cfg_signals': {
                            count = await prisma.signal.count()
                            const oldest = await prisma.signal.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.signal.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.updatedAt || null
                            break
                        }
                        case 'cfg_scoring_rules': {
                            count = await prisma.scoringRule.count()
                            const oldest = await prisma.scoringRule.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.scoringRule.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.updatedAt || null
                            break
                        }
                        case 'cfg_prompts': {
                            count = await prisma.prompt.count()
                            const oldest = await prisma.prompt.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
                            const latest = await prisma.prompt.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })
                            oldestRecord = oldest?.createdAt || null
                            latestRecord = latest?.updatedAt || null
                            break
                        }
                    }

                    return {
                        ...source,
                        count,
                        oldestRecord,
                        latestRecord
                    }
                } catch (e) {
                    console.error(`Error fetching data for ${source.tableName}:`, e)
                    return { ...source, count: 0, oldestRecord: null, latestRecord: null, error: 'Failed to fetch data' }
                }
            })
        )

        return NextResponse.json(results)
    } catch (error) {
        console.error('Data sources API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
