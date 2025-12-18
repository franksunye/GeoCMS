'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Play, ChevronDown, FileText, Sparkles, MessageSquare, Target, Zap, X, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

// Types
type Prompt = {
  id: string
  name: string
  version: string
  content: string
  description: string
  prompt_type: string
  variables: string | null
  output_schema: string | null
  is_default: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

type PromptType = {
  value: string
  label: string
  description: string
}

// Prompt type icons and colors
const PROMPT_TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>, color: string, bgColor: string }> = {
  quality_check: { icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  summarization: { icon: FileText, color: 'text-green-600', bgColor: 'bg-green-50' },
  sentiment: { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  coaching: { icon: Sparkles, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  custom: { icon: Zap, color: 'text-gray-600', bgColor: 'bg-gray-50' }
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0',
    description: '',
    prompt_type: 'quality_check',
    content: '',
    is_default: false,
    active: true
  })

  // Test Run state
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [testCalls, setTestCalls] = useState<any[]>([])
  const [selectedTestCallId, setSelectedTestCallId] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'result' | 'json'>('preview')

  // Fetch data
  useEffect(() => {
    fetchPrompts()
    fetchTestCalls()
  }, [])

  const fetchTestCalls = async () => {
    try {
      const res = await fetch('/api/prompts/calls')
      if (res.ok) {
        const data = await res.json()
        setTestCalls(data)
        if (data.length > 0) setSelectedTestCallId(data[0].id)
      }
    } catch (e) {
      console.error('Failed to fetch test calls', e)
    }
  }

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/prompts?metadata=true')
      if (!res.ok) throw new Error('Failed to fetch prompts')
      
      const data = await res.json()
      setPrompts(data.prompts || [])
      setPromptTypes(data.promptTypes || [])
    } catch (err) {
      setError(String(err))
      console.error('Error fetching prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('确定要删除这个提示词吗？')) return

    try {
      const res = await fetch(`/api/prompts?id=${promptId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setPrompts(prompts.filter(p => p.id !== promptId))
    } catch (err) {
      alert(String(err))
    }
  }

  const handleOpenCreateModal = () => {
    setSelectedPrompt(null)
    setFormData({
      name: '',
      version: '1.0',
      description: '',
      prompt_type: 'quality_check',
      content: '',
      is_default: false,
      active: true
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setFormData({
      name: prompt.name,
      version: prompt.version,
      description: prompt.description,
      prompt_type: prompt.prompt_type,
      content: prompt.content,
      is_default: prompt.is_default,
      active: prompt.active
    })
    setShowModal(true)
  }

  const handleSavePrompt = async () => {
    if (!formData.name || !formData.content) {
      alert('请填写名称和内容')
      return
    }

    setIsSaving(true)
    try {
      const method = selectedPrompt ? 'PUT' : 'POST'
      const body = selectedPrompt 
        ? { ...formData, id: selectedPrompt.id }
        : formData

      const res = await fetch('/api/prompts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      await fetchPrompts()
      setShowModal(false)
    } catch (err) {
      alert(String(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunTest = async (dryRun = true) => {
    if (!selectedTestCallId) {
      alert('请先选择一个通话记录')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setActiveTab('result')
    
    try {
      const res = await fetch('/api/prompts/execute', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            promptId: selectedPrompt?.id,
            promptContent: formData.content,
            callId: selectedTestCallId,
            dryRun: dryRun
         })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test failed')
      
      setTestResult(data)
    } catch (e) {
      alert(`测试失败: ${String(e)}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handlePingTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    setActiveTab('preview') // Use preview tab to show raw output
    setShowTestPanel(true)
    
    try {
      const res = await fetch('/api/prompts/execute', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         // Send current prompt content if creating new, or just ping properties
         body: JSON.stringify({ 
             ping: true,
             callId: selectedTestCallId, 
             // If we are editing, send ID. If creating, send promptContent from form
             promptId: selectedPrompt?.id,
             promptContent: formData.content
         })
      })

      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Ping failed')
      
      setTestResult({
          rawOutput: `✅ API 连接成功!\n\n响应: ${data.output}\n耗时: ${data.executionTime}ms`,
          replacements: data.replacements || [],
          preparedPrompt: data.preparedPrompt, // Save the preview content
          parsedOutput: null,
          executionTime: data.executionTime
      })
    } catch (e: any) {
      // alert(`连通性测试失败: ${String(e)}`) // Remove alert, use UI display
      setTestResult({
          rawOutput: `❌ API 连接失败\n\n${String(e)}`,
          replacements: [],
          preparedPrompt: null,
          parsedOutput: null,
          executionTime: 0
      })
    } finally {
      setIsTesting(false)
    }
  }



  const getTypeConfig = (type: string) => {
    return PROMPT_TYPE_CONFIG[type] || PROMPT_TYPE_CONFIG.custom
  }

  const getTypeLabel = (type: string) => {
    const found = promptTypes.find(t => t.value === type)
    return found?.label || type
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <PageHeader
          title="AI 提示词"
          description="管理 LLM 提示词模板，配置变量、测试执行，优化 AI 分析质量。"
          icon={
            <span className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
              <Sparkles className="h-6 w-6" />
            </span>
          }
          actions={
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
            >
              <Plus className="h-4 w-4" />
              创建提示词
            </button>
          }
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => {
          const typeConfig = getTypeConfig(prompt.prompt_type)
          const TypeIcon = typeConfig.icon

          return (
            <div
              key={prompt.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                    <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {prompt.is_default && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        默认
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      prompt.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {prompt.active ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {prompt.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {prompt.description || '暂无描述'}
                </p>
              </div>

              {/* Card Meta */}
              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="font-mono">v{prompt.version || '1.0'}</span>
                  <span>{getTypeLabel(prompt.prompt_type)}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => alert('测试运行功能即将实现')}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="测试运行"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(prompt)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty State */}
        {prompts.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无提示词</h3>
            <p className="text-gray-500 mb-4">点击上方按钮创建您的第一个 AI 提示词模板</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {selectedPrompt ? <Edit2 className="h-5 w-5 text-blue-500" /> : <Plus className="h-5 w-5 text-blue-500" />}
                {selectedPrompt ? '编辑提示词' : '创建新提示词'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Configuration */}
              <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto space-y-6 flex-shrink-0">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="e.g. 销售质检标准"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">版本</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="1.0"
                        value={formData.version}
                        onChange={e => setFormData({ ...formData, version: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white"
                        value={formData.prompt_type}
                        onChange={e => setFormData({ ...formData, prompt_type: e.target.value })}
                      >
                         {promptTypes.map(t => (
                           <option key={t.value} value={t.value}>{t.label}</option>
                         ))}
                         {promptTypes.length === 0 && <option value="quality_check">质量检测</option>}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                      rows={4}
                      placeholder="描述此提示词的用途..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all">
                        <input 
                            type="checkbox"
                            checked={formData.is_default}
                            onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <div>
                            <span className="block text-sm font-medium text-gray-900">设为默认</span>
                            <span className="block text-xs text-gray-500">此类型的默认模板</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all">
                        <input 
                            type="checkbox"
                            checked={formData.active}
                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <div>
                            <span className="block text-sm font-medium text-gray-900">启用状态</span>
                            <span className="block text-xs text-gray-500">供系统调用</span>
                        </div>
                    </label>
                </div>

                {/* Test Run Section */}
                <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Play className="h-4 w-4 text-blue-600" />
                        测试运行
                    </h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">选择测试通话</label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedTestCallId}
                                onChange={e => setSelectedTestCallId(e.target.value)}
                            >
                                {testCalls.map(call => (
                                    <option key={call.id} value={call.id}>
                                        {call.agentName} - {new Date(call.startedAt).toLocaleDateString()} ({Math.round(call.duration/60)}m)
                                    </option>
                                ))}
                                {testCalls.length === 0 && <option value="">无可用通话记录</option>}
                            </select>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePingTest();
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 flex items-center gap-1"
                            >
                                <Zap className="h-3 w-3" />
                                测试 API 连通性 (Ping)
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setShowTestPanel(true)
                                handleRunTest(true)
                            }}
                            disabled={isTesting || !selectedTestCallId}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTesting ? '执行中...' : '立即测试'}
                        </button>
                    </div>
                </div>
              </div>

              {/* Right Panel: Editor & Test Results */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowTestPanel(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showTestPanel ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            Prompt 内容
                        </button>
                        <button 
                            onClick={() => setShowTestPanel(true)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showTestPanel ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Play className="h-3.5 w-3.5" />
                            测试结果
                        </button>
                    </div>
                    
                    {!showTestPanel && (
                        <div className="flex gap-2">
                            <button className="hover:text-blue-600 transition-colors text-xs text-gray-500" title="插入变量">
                                插值: {`{{transcript}}`}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 relative overflow-hidden">
                    {/* Editor View */}
                    <div className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${showTestPanel ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <textarea
                            className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder="在此编写您的 Prompt..."
                            spellCheck={false}
                        />
                    </div>

                    {/* Test Result View */}
                    <div className={`absolute inset-0 flex flex-col bg-gray-50 transition-opacity duration-200 ${!showTestPanel ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {isTesting ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                <p>正在执行 AI 分析...</p>
                            </div>
                        ) : testResult ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex border-b border-gray-200 bg-white px-4">
                                    {['preview', 'result', 'json'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                                activeTab === tab 
                                                    ? 'border-blue-600 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {tab === 'preview' && 'Prompt 预览'}
                                            {tab === 'result' && '解析结果'}
                                            {tab === 'json' && '原始 JSON'}
                                        </button>
                                    ))}
                                    <div className="ml-auto flex items-center text-xs text-gray-500">
                                        耗时: {testResult.executionTime}ms
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                                    {testResult.isMock && (
                                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                                            <span className="mt-0.5 text-lg">⚠️</span>
                                            <div>
                                                <p className="font-bold">网络连接失败，使用了模拟数据</p>
                                                <p className="text-xs mt-1 text-amber-700 font-mono">{testResult.networkError}</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'preview' && (
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            {/* Show Ping Result / Status if it looks like a Ping result */}
                                            {testResult.rawOutput && (testResult.rawOutput.includes('API 连接') || testResult.rawOutput.includes('API Connected')) && (
                                                <div className={`mb-4 p-3 rounded border text-sm whitespace-pre-wrap ${testResult.rawOutput.includes('成功') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                                    {testResult.rawOutput}
                                                </div>
                                            )}

                                            {testResult.replacements?.length > 0 && (
                                                <div className="mb-4 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                                                    <span className="font-semibold">变量替换详情:</span>
                                                    <ul className="mt-1 list-disc list-inside">
                                                        {testResult.replacements.map((r: any) => (
                                                            <li key={r.variable}>{r.variable}: {r.found ? '已替换' : '未找到'}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            <div className="font-mono text-xs text-gray-500 mb-2 uppercase tracking-wide">
                                                Prompt Preview (Sent to AI):
                                            </div>
                                            <div className="font-mono text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-4">
                                                {testResult.preparedPrompt || "（暂无 Prompt 预览内容，请确保选择了通话记录和提示词）"}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'result' && (
                                        <div className="space-y-4">
                                            {testResult.parseError ? (
                                                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                                    <h4 className="font-bold mb-2">JSON 解析失败</h4>
                                                    <pre className="text-xs">{testResult.parseError}</pre>
                                                    <div className="mt-4">
                                                        <h5 className="font-semibold text-xs mb-1">原始输出:</h5>
                                                        <pre className="text-xs bg-white p-2 rounded border border-red-100 whitespace-pre-wrap">{testResult.rawOutput}</pre>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                                    {/* Render formatted signals if available */}
                                                    {testResult.parsedOutput?.signals?.length > 0 ? (
                                                        <div className="space-y-4">
                                                            <h4 className="font-bold text-gray-900">检测到的信号 ({testResult.parsedOutput.signals.length})</h4>
                                                            {testResult.parsedOutput.signals.map((signal: any, idx: number) => (
                                                                <div key={idx} className="p-3 border border-gray-100 rounded bg-gray-50 text-sm">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="font-semibold text-blue-700">{signal.name} ({signal.code})</span>
                                                                        <span className="font-mono text-gray-500">{signal.score}分</span>
                                                                    </div>
                                                                    <p className="text-gray-600 mb-2">{signal.reasoning}</p>
                                                                    {signal.context_text && (
                                                                        <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2">
                                                                            &quot;{signal.context_text}&quot;
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            
                                                            {testResult.parsedOutput.summary && (
                                                                <div className="mt-6 pt-4 border-t border-gray-100">
                                                                    <h4 className="font-bold text-gray-900 mb-2">分析总结</h4>
                                                                    <p className="text-sm text-gray-700">{testResult.parsedOutput.summary.overall_summary || JSON.stringify(testResult.parsedOutput.summary)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-500">
                                                            <p>未检测到结构化信号数据</p>
                                                            <p className="text-xs mt-2 text-gray-400">请检查 &quot;原始 JSON&quot; 页签查看 AI 实际返回的内容</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'json' && (
                                        <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-[500px] overflow-auto">
                                            {testResult.parsedOutput 
                                                ? JSON.stringify(testResult.parsedOutput, null, 2) 
                                                : (testResult.rawOutput || '无内容')}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Play className="h-12 w-12 mb-4 opacity-20" />
                                <p>点击左侧 &quot;立即测试&quot; 执行运行</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                取消
              </button>
              <button
                onClick={handleSavePrompt}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="h-4 w-4" />
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}
