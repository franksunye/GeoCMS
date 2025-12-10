'use client'

import { Settings, Save, RotateCcw, Plus, Edit2, Trash2, Eye, MoreHorizontal, Clock, User, Copy, Filter, X, Activity } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

type Tab = 'signals' | 'tags' | 'rules' | 'scoring' | 'history'

type Signal = {
  id: string
  code: string
  name: string
  category: string
  dimension: string
  targetTagCode: string
  aggregationMethod: string
  description: string
  active: boolean
  createdAt: string
  updatedAt: string
}

type Tag = {
  id: string
  name: string
  code: string
  category: string
  dimension: string
  polarity: string
  severity?: string
  scoreRange: string
  description: string
  active: boolean
  createdAt: string
  updatedAt: string
}

type ScoringRule = {
  id: string
  name: string
  appliesTo: 'Calls' | 'Leads' | 'All'
  description: string
  active: boolean
  ruleType: 'TagBased' | 'Manual' | 'ML-based'
  tagCode: string
  targetDimension: 'process' | 'skills' | 'communication'
  scoreAdjustment: number
  weight: number
  createdAt: string
  updatedAt: string
}

type ScoreCalculationConfig = {
  id: string
  aggregationMethod: 'weighted-average' | 'custom'
  processWeight: number
  skillsWeight: number
  communicationWeight: number
  customFormula?: string
  description: string
  createdAt: string
  updatedAt: string
}

type AuditLog = {
  id: string
  timestamp: string
  user: string
  action: 'Create' | 'Edit' | 'Delete' | 'Enable' | 'Disable' | 'Rollback'
  objectType: 'Tag' | 'Rule'
  objectName: string
  changes: string
  details: string
}




export default function ConversationConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('signals')
  const [signals, setSignals] = useState<Signal[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [rules, setRules] = useState<ScoringRule[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [scoreConfig, setScoreConfig] = useState<ScoreCalculationConfig | null>(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showSignalModal, setShowSignalModal] = useState(false)
  const [showRulePreview, setShowRulePreview] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [selectedRule, setSelectedRule] = useState<ScoringRule | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Filter State
  const [filterState, setFilterState] = useState({
    category: '',
    dimension: '',
    polarity: ''
  })

  // Fetch Data from SQLite
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, signalsRes, rulesRes, scoreRes] = await Promise.all([
          fetch('/api/team-calls/config/tags'),
          fetch('/api/team-calls/config/signals'),
          fetch('/api/team-calls/config/rules'),
          fetch('/api/team-calls/config/score')
        ])
        
        if (tagsRes.ok) {
          const data = await tagsRes.json()
          setTags(data)
        }
        
        if (signalsRes.ok) {
          const data = await signalsRes.json()
          setSignals(data)
        }

        if (rulesRes.ok) {
          const data = await rulesRes.json()
          setRules(data)
        }

        if (scoreRes.ok) {
          const data = await scoreRes.json()
          setScoreConfig(data)
          setScoreForm({
            processWeight: data.processWeight,
            skillsWeight: data.skillsWeight,
            communicationWeight: data.communicationWeight
          })
        }
      } catch (e) {
        console.error('Error fetching config data:', e)
      }
    }
    fetchData()
  }, [])

  // Derived Filtered Tags
  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      if (filterState.category && tag.category !== filterState.category) return false
      if (filterState.dimension && tag.dimension !== filterState.dimension) return false
      if (filterState.polarity && tag.polarity !== filterState.polarity) return false
      return true
    })
  }, [tags, filterState])

  // Derived Filtered Signals
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      if (filterState.category && signal.category !== filterState.category) return false
      if (filterState.dimension && signal.dimension !== filterState.dimension) return false
      return true
    })
  }, [signals, filterState])

  // Unique Options for Filters
  const categories = useMemo(() => Array.from(new Set([...tags.map(t => t.category), ...signals.map(s => s.category)])), [tags, signals])
  const dimensions = useMemo(() => Array.from(new Set([...tags.map(t => t.dimension), ...signals.map(s => s.dimension)])), [tags, signals])
  
  // Signal form state
  const [signalForm, setSignalForm] = useState({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', targetTagCode: '', aggregationMethod: 'Count', description: '', active: true })
  
  // Tag form state
  const [tagForm, setTagForm] = useState({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', polarity: 'Neutral' as const, severity: '无', scoreRange: '1-5', description: '', active: true })
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({ name: '', description: '', tagCode: '', targetDimension: 'skills' as 'process' | 'skills' | 'communication', scoreAdjustment: 0, weight: 1.0, active: true })
  
  // Score config form state
  const [scoreForm, setScoreForm] = useState({ processWeight: 30, skillsWeight: 50, communicationWeight: 20 })



  const handleSaveSignal = async () => {
    setIsSaving(true)
    try {
      const method = selectedSignal ? 'PUT' : 'POST'
      const body = selectedSignal ? { ...signalForm, id: selectedSignal.id } : signalForm
      
      const res = await fetch('/api/team-calls/config/signals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save signal')

      // Refresh signals
      const signalsRes = await fetch('/api/team-calls/config/signals')
      if (signalsRes.ok) {
        setSignals(await signalsRes.json())
      }
      
      setShowSignalModal(false)
      setSignalForm({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', targetTagCode: '', aggregationMethod: 'Count', description: '', active: true })
    } catch (error) {
      console.error('Error saving signal:', error)
      alert('Failed to save signal')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSignal = async (signalId: string) => {
    const signal = signals.find(s => s.id === signalId)
    if (!signal) return

    try {
      const res = await fetch('/api/team-calls/config/signals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signal, active: !signal.active })
      })

      if (!res.ok) throw new Error('Failed to update signal')

      setSignals(signals.map((s: Signal) => s.id === signalId ? { ...s, active: !s.active } : s))
    } catch (error) {
      console.error('Error toggling signal:', error)
    }
  }

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm('Are you sure you want to delete this signal?')) return

    try {
      const res = await fetch(`/api/team-calls/config/signals?id=${signalId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete signal')

      setSignals(signals.filter(s => s.id !== signalId))
    } catch (error) {
      console.error('Error deleting signal:', error)
      alert('Failed to delete signal')
    }
  }

  const handleSaveTag = async () => {
    setIsSaving(true)
    try {
      const method = selectedTag ? 'PUT' : 'POST'
      const body = selectedTag ? { ...tagForm, id: selectedTag.id } : tagForm
      
      const res = await fetch('/api/team-calls/config/tags', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save tag')

      // Refresh tags
      const tagsRes = await fetch('/api/team-calls/config/tags')
      if (tagsRes.ok) {
        setTags(await tagsRes.json())
      }
      
      setShowTagModal(false)
      setTagForm({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', polarity: 'Neutral', severity: '无', scoreRange: '1-5', description: '', active: true })
    } catch (error) {
      console.error('Error saving tag:', error)
      alert('Failed to save tag')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRule = async () => {
    setIsSaving(true)
    try {
      const method = selectedRule ? 'PUT' : 'POST'
      const body = selectedRule ? { ...ruleForm, id: selectedRule.id } : ruleForm
      
      const res = await fetch('/api/team-calls/config/rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save rule')

      // Refresh rules
      const rulesRes = await fetch('/api/team-calls/config/rules')
      if (rulesRes.ok) {
        setRules(await rulesRes.json())
      }
      
      setShowRuleModal(false)
      setRuleForm({ name: '', description: '', tagCode: '', targetDimension: 'skills', scoreAdjustment: 0, weight: 1.0, active: true })
    } catch (error) {
      console.error('Error saving rule:', error)
      alert('Failed to save rule')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveScoreConfig = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/team-calls/config/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scoreForm,
          aggregationMethod: 'weighted-average',
          description: 'Default Config'
        })
      })

      if (!res.ok) throw new Error('Failed to save score config')
      
      alert('Score configuration saved successfully')
    } catch (error) {
      console.error('Error saving score config:', error)
      alert('Failed to save score configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleTag = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return

    try {
      const res = await fetch('/api/team-calls/config/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tag, active: !tag.active })
      })

      if (!res.ok) throw new Error('Failed to update tag')

      setTags(tags.map((t: Tag) => t.id === tagId ? { ...t, active: !t.active } : t))
    } catch (error) {
      console.error('Error toggling tag:', error)
    }
  }

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    try {
      const res = await fetch('/api/team-calls/config/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, active: !rule.active })
      })

      if (!res.ok) throw new Error('Failed to update rule')

      setRules(rules.map((r: ScoringRule) => r.id === ruleId ? { ...r, active: !r.active } : r))
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    try {
      const res = await fetch(`/api/team-calls/config/tags?id=${tagId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete tag')

      setTags(tags.filter(t => t.id !== tagId))
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const res = await fetch(`/api/team-calls/config/rules?id=${ruleId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete rule')

      setRules(rules.filter(r => r.id !== ruleId))
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert('Failed to delete rule')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Conversation Configuration</h1>
        <p className="mt-2 text-gray-600">Manage tags, scoring rules, and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg mb-6 border-b border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'signals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Signal Definitions
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tags'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Tag Taxonomy
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Scoring Rules
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scoring'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Score Calculation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            History & Audit
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'signals' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Signal Definitions</h2>
              <button
                onClick={() => {
                  setSelectedSignal(null)
                  setSignalForm({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', targetTagCode: '', aggregationMethod: 'Count', description: '', active: true })
                  setShowSignalModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Signal
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={filterState.category}
                onChange={(e) => setFilterState({ ...filterState, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterState.dimension}
                onChange={(e) => setFilterState({ ...filterState, dimension: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Dimensions</option>
                {dimensions.sort().map(dim => (
                  <option key={dim} value={dim}>{dim}</option>
                ))}
              </select>

              {(filterState.category || filterState.dimension) && (
                <button
                  onClick={() => setFilterState({ category: '', dimension: '', polarity: '' })}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Signals Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category / Dimension</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description / Logic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSignals.map((signal) => (
                  <tr key={signal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{signal.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{signal.code}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{signal.category}</span>
                        <span className="text-xs text-gray-500">{signal.dimension}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-xs text-blue-600">
                      {signal.targetTagCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{signal.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signal.active}
                          onChange={() => handleToggleSignal(signal.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{signal.active ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSignal(signal)
                            setSignalForm({
                              name: signal.name,
                              code: signal.code,
                              category: signal.category,
                              dimension: signal.dimension,
                              targetTagCode: signal.targetTagCode,
                              aggregationMethod: signal.aggregationMethod,
                              description: signal.description,
                              active: signal.active
                            })
                            setShowSignalModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-700" 
                          title="Delete"
                          onClick={() => handleDeleteSignal(signal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tag Management</h2>
              <button
                onClick={() => {
                  setSelectedTag(null)
                  setTagForm({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', polarity: 'Neutral', severity: '无', scoreRange: '1-5', description: '', active: true })
                  setShowTagModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Tag
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={filterState.category}
                onChange={(e) => setFilterState({ ...filterState, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterState.dimension}
                onChange={(e) => setFilterState({ ...filterState, dimension: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Dimensions</option>
                {dimensions.sort().map(dim => (
                  <option key={dim} value={dim}>{dim}</option>
                ))}
              </select>

              <select
                value={filterState.polarity}
                onChange={(e) => setFilterState({ ...filterState, polarity: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Polarities</option>
                {Array.from(new Set(tags.map(t => t.polarity))).sort().map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {(filterState.category || filterState.dimension || filterState.polarity) && (
                <button
                  onClick={() => setFilterState({ category: '', dimension: '', polarity: '' })}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Tags Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category / Dimension</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Polarity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tag.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{tag.code}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{tag.category}</span>
                        <span className="text-xs text-gray-500">{tag.dimension}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tag.polarity === 'Positive' ? 'bg-green-100 text-green-800' :
                        tag.polarity === 'Negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tag.polarity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tag.active}
                          onChange={() => handleToggleTag(tag.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{tag.active ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{tag.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTag(tag)
                            setTagForm({
                              name: tag.name,
                              code: tag.code,
                              category: tag.category,
                              dimension: tag.dimension,
                              polarity: tag.polarity as any,
                              severity: tag.severity || '无',
                              scoreRange: tag.scoreRange,
                              description: tag.description,
                              active: tag.active
                            })
                            setShowTagModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-700" 
                          title="Delete"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Scoring Rules</h2>
            <button
              onClick={() => {
                setSelectedRule(null)
                setRuleForm({ name: '', description: '', tagCode: '', targetDimension: 'skills', scoreAdjustment: 0, weight: 1.0, active: true })
                setShowRuleModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
          </div>

          {/* Rules Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rule Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target Dimension</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Adjustment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{rule.tagCode}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rule.targetDimension === 'process' && '⚙️ Process'}
                        {rule.targetDimension === 'skills' && '🎯 Skills'}
                        {rule.targetDimension === 'communication' && '🗣️ Communication'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      <span className={rule.scoreAdjustment > 0 ? 'text-green-600' : rule.scoreAdjustment < 0 ? 'text-red-600' : 'text-gray-600'}>
                        {rule.scoreAdjustment > 0 ? '+' : ''}{rule.scoreAdjustment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rule.weight.toFixed(1)}x</td>
                    <td className="px-6 py-4 text-sm">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => handleToggleRule(rule.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{rule.active ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRule(rule)
                            setRuleForm({
                              name: rule.name,
                              description: rule.description,
                              tagCode: rule.tagCode,
                              targetDimension: rule.targetDimension,
                              scoreAdjustment: rule.scoreAdjustment,
                              weight: rule.weight,
                              active: rule.active
                            })
                            setShowRuleModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedRule(rule)
                            setShowRulePreview(true)
                          }}
                          className="text-green-600 hover:text-green-700" 
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700" 
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'scoring' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Score Calculation Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">Define how the overall quality score is calculated from the three dimensions</p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Aggregation Method */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Aggregation Method</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input type="radio" name="method" value="weighted-average" defaultChecked className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700"><strong>Weighted Average</strong> (Recommended)</span>
                </label>
                <p className="text-xs text-gray-500 ml-7">overallScore = (process × weight) + (skills × weight) + (communication × weight)</p>
              </div>
            </div>

            {/* Weight Configuration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Score Weights</h3>
              <p className="text-xs text-gray-500 mb-4">Adjust how each dimension contributes to the overall score (total must equal 100%)</p>
              
              <div className="space-y-5">
                {/* Process Weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">⚙️ Process Score Weight</label>
                    <span className="text-sm font-semibold text-gray-900">{scoreForm.processWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm.processWeight}
                    onChange={(e) => {
                      const newProcess = parseInt(e.target.value)
                      const available = 100 - newProcess
                      setScoreForm({
                        ...scoreForm,
                        processWeight: newProcess,
                        skillsWeight: Math.min(scoreForm.skillsWeight, available),
                      })
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Skills Weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">🎯 Skills Score Weight</label>
                    <span className="text-sm font-semibold text-gray-900">{scoreForm.skillsWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm.skillsWeight}
                    onChange={(e) => {
                      const newSkills = parseInt(e.target.value)
                      const available = 100 - newSkills
                      setScoreForm({
                        ...scoreForm,
                        skillsWeight: newSkills,
                        communicationWeight: Math.min(scoreForm.communicationWeight, available),
                      })
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Communication Weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">🗣️ Communication Score Weight</label>
                    <span className="text-sm font-semibold text-gray-900">{scoreForm.communicationWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm.communicationWeight}
                    onChange={(e) => setScoreForm({ ...scoreForm, communicationWeight: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Total Display */}
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium">Total Weight</p>
                  <p className={`text-lg font-bold ${scoreForm.processWeight + scoreForm.skillsWeight + scoreForm.communicationWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreForm.processWeight + scoreForm.skillsWeight + scoreForm.communicationWeight}%
                  </p>
                </div>
              </div>
            </div>

            {/* Formula Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Formula Preview</h4>
              <code className="text-sm text-blue-800 font-mono block p-3 bg-white rounded border border-blue-100">
                overallScore = (process × {(scoreForm.processWeight / 100).toFixed(2)}) + (skills × {(scoreForm.skillsWeight / 100).toFixed(2)}) + (communication × {(scoreForm.communicationWeight / 100).toFixed(2)})
              </code>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Reset to Default
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                onClick={handleSaveScoreConfig}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Audit Log & Version History</h2>
          </div>

          {/* Audit Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Object</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Changes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {log.user}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action === 'Create'
                            ? 'bg-green-100 text-green-800'
                            : log.action === 'Delete'
                            ? 'bg-red-100 text-red-800'
                            : log.action === 'Edit'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {log.objectType}
                      </span>
                      <span className="ml-2 font-medium text-gray-900">{log.objectName}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{log.changes}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signal Modal */}
      {showSignalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedSignal ? 'Edit Signal' : 'Add New Signal'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signal Name</label>
                <input
                  type="text"
                  placeholder="e.g., Competitor Mention"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={signalForm.name}
                  onChange={(e) => setSignalForm({ ...signalForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signal Code</label>
                <input
                  type="text"
                  placeholder="e.g., competitor_mention"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={signalForm.code}
                  onChange={(e) => setSignalForm({ ...signalForm, code: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={signalForm.category}
                    onChange={(e) => setSignalForm({ ...signalForm, category: e.target.value })}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="New Category">New Category...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimension</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={signalForm.dimension}
                    onChange={(e) => setSignalForm({ ...signalForm, dimension: e.target.value })}
                  >
                    {dimensions.map(dim => <option key={dim} value={dim}>{dim}</option>)}
                    <option value="New Dimension">New Dimension...</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Tag Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., linked_tag_code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={signalForm.targetTagCode}
                  onChange={(e) => setSignalForm({ ...signalForm, targetTagCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aggregation Method</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={signalForm.aggregationMethod}
                  onChange={(e) => setSignalForm({ ...signalForm, aggregationMethod: e.target.value })}
                >
                  <option value="Count">Count Occurrences</option>
                  <option value="Existence">Check Existence</option>
                  <option value="Sentiment">Sentiment Analysis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Logic</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={signalForm.description}
                  onChange={(e) => setSignalForm({ ...signalForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <input
                  id="signal-active"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={signalForm.active}
                  onChange={(e) => setSignalForm({ ...signalForm, active: e.target.checked })}
                />
                <label htmlFor="signal-active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSignalModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSignal}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Signal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTag ? 'Edit Tag' : 'Add New Tag'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                <input
                  type="text"
                  placeholder="e.g., Price Objection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code / Key</label>
                <input
                  type="text"
                  placeholder="e.g., price_objection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  value={tagForm.code}
                  onChange={(e) => setTagForm({ ...tagForm, code: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={tagForm.category}
                    onChange={(e) => setTagForm({ ...tagForm, category: e.target.value })}
                  >
                    <option value="Sales">Sales</option>
                    <option value="Customer">Customer</option>
                    <option value="Service Issue">Service Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimension</label>
                  <input
                    type="text"
                    placeholder="e.g., Sales.Process"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={tagForm.dimension}
                    onChange={(e) => setTagForm({ ...tagForm, dimension: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Polarity</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={tagForm.polarity}
                    onChange={(e) => setTagForm({ ...tagForm, polarity: e.target.value as any })}
                  >
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score Range</label>
                  <input
                    type="text"
                    placeholder="e.g., 1-5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={tagForm.scoreRange}
                    onChange={(e) => setTagForm({ ...tagForm, scoreRange: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Tag definition and usage guidelines..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={tagForm.description}
                  onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={tagForm.active}
                  onChange={(e) => setTagForm({ ...tagForm, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded" 
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTag}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedRule ? 'Edit Scoring Rule' : 'Add New Scoring Rule'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g., High Purchase Intent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What does this rule do?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag to Monitor</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={ruleForm.tagCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, tagCode: e.target.value })}
                  >
                    <option value="">Select a tag...</option>
                    {tags.map(t => (
                      <option key={t.id} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affects Dimension</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={ruleForm.targetDimension}
                    onChange={(e) => setRuleForm({ ...ruleForm, targetDimension: e.target.value as any })}
                  >
                    <option value="process">⚙️ Process Score</option>
                    <option value="skills">🎯 Skills Score</option>
                    <option value="communication">🗣️ Communication Score</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score Adjustment (-100 to +100)</label>
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={ruleForm.scoreAdjustment}
                    onChange={(e) => setRuleForm({ ...ruleForm, scoreAdjustment: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (0.5-2.0)</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.5}
                    max={2.0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={ruleForm.weight}
                    onChange={(e) => setRuleForm({ ...ruleForm, weight: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={ruleForm.active}
                  onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded" 
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                  <strong>📌 Logic:</strong> When tag is detected, apply score adjustment to the target dimension with the specified weight.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end sticky bottom-0 bg-gray-50">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Preview Modal */}
      {showRulePreview && selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Rule Details: {selectedRule.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedRule.description}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Trigger</h4>
                <p className="text-sm text-gray-700">When tag <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono">{selectedRule.tagCode}</code> is detected</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium uppercase">Target</p>
                  <p className="text-lg font-bold text-purple-900 mt-1">
                    {selectedRule.targetDimension === 'process' && '⚙️ Process'}
                    {selectedRule.targetDimension === 'skills' && '🎯 Skills'}
                    {selectedRule.targetDimension === 'communication' && '🗣️ Communication'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium uppercase">Impact</p>
                  <p className={`text-lg font-bold mt-1 ${selectedRule.scoreAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedRule.scoreAdjustment > 0 ? '+' : ''}{selectedRule.scoreAdjustment} pts
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-600 font-medium uppercase">Weight</p>
                  <p className="text-lg font-bold text-orange-900 mt-1">{selectedRule.weight}x</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowRulePreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
