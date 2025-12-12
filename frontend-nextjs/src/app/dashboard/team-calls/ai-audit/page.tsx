'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle, CheckCircle, Search, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface Signal {
  id: string
  signalCode: string
  contextText: string
  timestampSec: number
  confidence: number
}

interface TagAnalysis {
  tagCode: string
  score: number
  signalCount: number
  eventCount: number
  diff: number
  status: 'ok' | 'missing_aggregation' | 'extra_aggregation'
  details: {
    signals: Signal[]
    events: any[]
  }
}

interface AuditRecord {
  id: string
  startedAt: string
  agentName: string
  signalCount: number
  tagCount: number
  totalConsistencyScore: number
  issuesCount: number
  analysis: TagAnalysis[]
}

export default function AiAuditPage() {
  const [data, setData] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/team-calls/ai-audit')
      const json = await res.json()
      setData(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (score: number) => {
    if (score === 100) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 80) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getDiffBadge = (analysis: TagAnalysis) => {
    if (analysis.status === 'ok') {
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">OK</span>
    }
    if (analysis.status === 'missing_aggregation') {
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">丢失 ({analysis.diff})</span>
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">冗余 (+{Math.abs(analysis.diff)})</span>
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="AI 审计 & 调试"
        description="检查 Signal 到 Tag 聚合过程中的数据一致性与丢包情况"
        actions={
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
            刷新数据
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Call List */}
        <div className="lg:col-span-1 space-y-4">
           {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
           ) : (
             data.map(record => (
               <div 
                 key={record.id}
                 onClick={() => setSelectedRecord(record)}
                 className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRecord?.id === record.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
               >
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-gray-900">{record.agentName}</h3>
                        <p className="text-xs text-gray-500">{new Date(record.startedAt).toLocaleString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(record.totalConsistencyScore)}`}>
                        {record.totalConsistencyScore}% 一致
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Signals: {record.signalCount}</span>
                    <span>Tags: {record.tagCount}</span>
                    {record.issuesCount > 0 && (
                        <span className="flex items-center text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {record.issuesCount} 异常
                        </span>
                    )}
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Right: Detailed Audit */}
        <div className="lg:col-span-2">
            {selectedRecord ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex justify-between">
                            <span>审计详情: {selectedRecord.agentName}</span>
                            <span className="text-sm font-normal text-gray-500 font-mono">Call ID: {selectedRecord.id}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {selectedRecord.analysis.map((item, idx) => (
                                <div key={idx} className={`border rounded-md p-4 ${item.status !== 'ok' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-semibold text-gray-800">{item.tagCode}</span>
                                            {getDiffBadge(item)}
                                        </div>
                                        <div className="text-xs text-gray-500 flex gap-3">
                                            <span>Expected (Signals): <b>{item.signalCount}</b></span>
                                            <span>Actual (Events): <b>{item.eventCount}</b></span>
                                        </div>
                                    </div>

                                    {/* Comparison View */}
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        {/* Raw Signals Side */}
                                        <div className="border-r pr-4 border-dashed border-gray-300">
                                            <h4 className="font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                                <Search className="w-3 h-3" /> Raw Signals (LLM Sources)
                                            </h4>
                                            {item.details.signals.length === 0 ? (
                                                <span className="text-gray-400 italic">No signals found</span>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {item.details.signals.map((s, i) => (
                                                        <li key={i} className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                                <span>{s.timestampSec ? `${s.timestampSec}s` : 'N/A'}</span>
                                                                <span>Confidence: {s.confidence ?? '-'}</span>
                                                            </div>
                                                            <div className="text-gray-800">"{s.contextText}"</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Aggregated Events Side */}
                                        <div>
                                            <h4 className="font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Aggregated Context (User View)
                                            </h4>
                                            {item.details.events.length === 0 ? (
                                                <span className="text-gray-400 italic">No aggregated events</span>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {item.details.events.map((e: any, i: number) => (
                                                        <li key={i} className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                                <span>{typeof e === 'object' && e.timestamp_sec ? `${e.timestamp_sec}s` : 'N/A'}</span>
                                                                <span>Confidence: {typeof e === 'object' ? e.confidence : '-'}</span>
                                                            </div>
                                                            <div className="text-gray-800">
                                                                "{typeof e === 'object' ? e.context_text : e}"
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-12 text-gray-400">
                    请选择左侧通话记录以查看审计详情
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
