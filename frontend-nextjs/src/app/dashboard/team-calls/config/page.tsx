'use client'

import { Settings, Save, RotateCcw, Plus, Edit2, Trash2, Eye, MoreHorizontal, Clock, User, Copy, Filter, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

type Tab = 'tags' | 'rules' | 'scoring' | 'history'

type Tag = {
  id: string
  name: string
  code: string
  category: string
  dimension: string
  polarity: 'positive' | 'neutral' | 'negative'
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

// Mock data - extracted from Call List actual data
const mockTags: Tag[] = [
  // Sales - Sales.Process
  { id: '1', name: 'Opening Complete', code: 'opening_complete', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-1', description: '完整介绍角色与目的', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '2', name: 'Needs Identification Basic', code: 'needs_identification_basic', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '基础需求识别', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '3', name: 'Needs Identification Deep', code: 'needs_identification_deep', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '深度需求探查（原因推测等）', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '4', name: 'Solution Proposal Basic', code: 'solution_proposal_basic', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '提供基础方案方向', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '5', name: 'Solution Proposal Professional', code: 'solution_proposal_professional', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '解释检测技术、拆除可能性', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '6', name: 'Schedule Attempt', code: 'schedule_attempt', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '尝试推进预约', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '7', name: 'Same Day Visit Attempt', code: 'same_day_visit_attempt', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '主动提出当天上门', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '8', name: 'Handover Process Explained', code: 'handover_process_explained', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '明确流程（检测→报价→施工）', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  
  // Sales - Sales.Skills
  { id: '9', name: 'Handle Objection Basic', code: 'skill_handle_objection_basic', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '常规异议处理', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '10', name: 'Handle Objection Price', code: 'skill_handle_objection_price', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '价格异议处理', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '11', name: 'Handle Objection Time', code: 'skill_handle_objection_time', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '时间类异议处理', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '12', name: 'Handle Objection Scope', code: 'skill_handle_objection_scope', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '对检测/拆除的异议处理', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '13', name: 'Handle Objection Risk', code: 'skill_handle_objection_risk', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '对风险的异议处理', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '14', name: 'Handle Objection Trust', code: 'skill_handle_objection_trust', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '信任类异议处理', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '15', name: 'Active Selling Proposition', code: 'active_selling_proposition', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '主动介绍服务价值', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '16', name: 'Objection Prevention Proactive', code: 'objection_prevention_proactive', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '主动预防异议（提前说明）', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '17', name: 'Expectation Setting', code: 'expectation_setting', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '预期管理（时间/施工范围）', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '18', name: 'Expertise Display', code: 'expertise_display', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '技术专业性展示', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

  // Sales - Sales.Communication
  { id: '19', name: 'Listening Good', code: 'listening_good', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '认真倾听（复述、回应）', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '20', name: 'Empathy Response', code: 'empathy_response', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '共情、安抚客户情绪', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '21', name: 'Clarity of Explanation', code: 'clarity_of_explanation', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '解释清晰易懂', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '22', name: 'Tone Professional', code: 'tone_professional', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '专业语气', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '23', name: 'Attitude Positive', code: 'attitude_positive', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '态度积极', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

  // Customer - Customer.Intent
  { id: '24', name: 'Customer High Intent', code: 'customer_high_intent', category: 'Customer', dimension: 'Customer.Intent', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '强烈需求（急、焦虑）', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '25', name: 'Customer Solution Request', code: 'customer_solution_request', category: 'Customer', dimension: 'Customer.Intent', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '索要维修方案', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '26', name: 'Customer Pricing Request', code: 'customer_pricing_request', category: 'Customer', dimension: 'Customer.Intent', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '索要报价', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '27', name: 'Customer Schedule Request', code: 'customer_schedule_request', category: 'Customer', dimension: 'Customer.Intent', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '主动提议预约', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

  // Customer - Customer.Attribute
  { id: '28', name: 'Customer Role Owner', code: 'customer_role_owner', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '房主身份', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '29', name: 'Customer Objection Price', code: 'customer_objection_price', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '价格异议', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '30', name: 'Customer Objection Time', code: 'customer_objection_time', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '时间冲突', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '31', name: 'Customer Objection Trust', code: 'customer_objection_trust', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '不信任', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '32', name: 'Customer Objection Scope', code: 'customer_objection_scope', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '质疑必要性', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

  // Service Issue
  { id: '33', name: 'Schedule Delay Customer Reason', code: 'schedule_delay_customer_reason', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '因客户导致延迟', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '34', name: 'Schedule Delay Agent Reason', code: 'schedule_delay_agent_reason', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '因工程师导致延迟', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '35', name: 'Misalignment Price', code: 'misalignment_price', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '费用沟通不一致', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '36', name: 'Misalignment Scope', code: 'misalignment_scope', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '对施工范围理解偏差', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '37', name: 'Communication Breakdown', code: 'communication_breakdown', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '沟通中断/冲突', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  { id: '38', name: 'Risk Unaddressed', code: 'risk_unaddressed', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '风险被忽略未解释', active: true, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
]

const mockRules: ScoringRule[] = [
  {
    id: '1',
    name: 'Customer High Intent Signal',
    appliesTo: 'Calls',
    description: 'Strong signal of purchase intent - boost skills score significantly',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'customer_high_intent',
    targetDimension: 'skills',
    scoreAdjustment: 35,
    weight: 1.5,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '2',
    name: 'Pricing Inquiry Check',
    appliesTo: 'Calls',
    description: 'Pricing inquiry may indicate concerns or objection - moderate skill challenge',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'customer_pricing_request',
    targetDimension: 'skills',
    scoreAdjustment: -15,
    weight: 0.9,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '3',
    name: 'Solution Request Opportunity',
    appliesTo: 'Calls',
    description: 'Detailed solution request indicates engagement and interest',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'customer_solution_request',
    targetDimension: 'skills',
    scoreAdjustment: 25,
    weight: 1.2,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '4',
    name: 'Good Listening Practice',
    appliesTo: 'Calls',
    description: 'Agent demonstrated excellent listening - increases communication quality',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'listening_good',
    targetDimension: 'communication',
    scoreAdjustment: 20,
    weight: 1.1,
    createdAt: '2025-12-02',
    updatedAt: '2025-12-02',
  },
  {
    id: '5',
    name: 'Active Sales Engagement',
    appliesTo: 'Calls',
    description: 'Agent proactively presented value - positive skills indicator',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'active_selling_proposition',
    targetDimension: 'skills',
    scoreAdjustment: 22,
    weight: 1.15,
    createdAt: '2025-12-02',
    updatedAt: '2025-12-02',
  },
  {
    id: '6',
    name: 'SLA Breach Alert',
    appliesTo: 'Calls',
    description: 'Service level agreement breach - significant process failure',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'sla_exceeded',
    targetDimension: 'process',
    scoreAdjustment: -40,
    weight: 1.3,
    createdAt: '2025-12-02',
    updatedAt: '2025-12-02',
  },
  {
    id: '7',
    name: 'Callback Delay Issue',
    appliesTo: 'Calls',
    description: 'Delayed callback impacts customer satisfaction and process score',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'callback_delay',
    targetDimension: 'process',
    scoreAdjustment: -25,
    weight: 1.0,
    createdAt: '2025-12-02',
    updatedAt: '2025-12-02',
  },
]

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2025-12-03 14:22',
    user: 'admin@example.com',
    action: 'Create',
    objectType: 'Tag',
    objectName: 'Competitor Mention',
    changes: 'New tag created',
    details: 'Code: competitor_mention, Category: Skills',
  },
  {
    id: '2',
    timestamp: '2025-12-02 10:15',
    user: 'config@example.com',
    action: 'Edit',
    objectType: 'Rule',
    objectName: 'High Purchase Intent',
    changes: 'Weight: 1.0 → 1.2',
    details: 'Adjusted weight for better balance',
  },
]

const mockScoreConfig: ScoreCalculationConfig = {
  id: '1',
  aggregationMethod: 'weighted-average',
  processWeight: 30,
  skillsWeight: 50,
  communicationWeight: 20,
  description: 'Default score calculation: balanced emphasis on skills and process',
  createdAt: '2025-12-01',
  updatedAt: '2025-12-03',
}

export default function ConversationConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tags')
  const [tags, setTags] = useState<Tag[]>(mockTags)
  const [rules, setRules] = useState<ScoringRule[]>(mockRules)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [scoreConfig, setScoreConfig] = useState<ScoreCalculationConfig>(mockScoreConfig)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showRulePreview, setShowRulePreview] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [selectedRule, setSelectedRule] = useState<ScoringRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Filter State
  const [filterState, setFilterState] = useState({
    category: '',
    dimension: '',
    polarity: '' as '' | 'positive' | 'neutral' | 'negative'
  })

  // Fetch Tags from SQLite
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/team-calls/config/tags')
        if (res.ok) {
          const data = await res.json()
          setTags(data)
        } else {
           console.warn('Failed to fetch tags from API, keeping mock data')
        }
      } catch (e) {
        console.error('Error fetching tags:', e)
      }
    }
    fetchTags()
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

  // Unique Options for Filters
  const categories = useMemo(() => Array.from(new Set(tags.map(t => t.category))), [tags])
  const dimensions = useMemo(() => Array.from(new Set(tags.map(t => t.dimension))), [tags])
  
  // Tag form state
  const [tagForm, setTagForm] = useState({ name: '', code: '', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive' as const, severity: '无', scoreRange: '1-5', description: '', active: true })
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({ name: '', description: '', tagCode: '', targetDimension: 'skills' as const, scoreAdjustment: 0, weight: 1.0, active: true })
  
  // Score config form state
  const [scoreForm, setScoreForm] = useState({ processWeight: 30, skillsWeight: 50, communicationWeight: 20 })



  const handleSaveTag = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowTagModal(false)
    }, 1000)
  }

  const handleSaveRule = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowRuleModal(false)
    }, 1000)
  }

  const handleToggleTag = (tagId: string) => {
    setTags(tags.map((t: Tag) => t.id === tagId ? { ...t, active: !t.active } : t))
  }

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map((r: ScoringRule) => r.id === ruleId ? { ...r, active: !r.active } : r))
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
      {activeTab === 'tags' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tag Management</h2>
              <button
                onClick={() => {
                  setSelectedTag(null)
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
                {Array.from(new Set(tags.map(t => t.category))).sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterState.dimension}
                onChange={(e) => setFilterState({ ...filterState, dimension: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Dimensions</option>
                {Array.from(new Set(tags.filter(t => !filterState.category || t.category === filterState.category).map(t => t.dimension))).sort().map(dim => (
                  <option key={dim} value={dim}>{dim}</option>
                ))}
              </select>

              <select
                value={filterState.polarity}
                onChange={(e) => setFilterState({ ...filterState, polarity: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
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
                        tag.polarity === 'positive' ? 'bg-green-100 text-green-800' :
                        tag.polarity === 'negative' ? 'bg-red-100 text-red-800' :
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
                            setShowTagModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700" title="Delete">
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
                        <button className="text-gray-600 hover:text-gray-700" title="More">
                          <MoreHorizontal className="h-4 w-4" />
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
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Save Configuration
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
                  defaultValue={selectedTag?.name || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code / Key</label>
                <input
                  type="text"
                  placeholder="e.g., price_objection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  defaultValue={selectedTag?.code || ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedTag?.category || 'Sales'}
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
                    defaultValue={selectedTag?.dimension || ''}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Polarity</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedTag?.polarity || 'positive'}
                  >
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score Range</label>
                  <input
                    type="text"
                    placeholder="e.g., 1-5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedTag?.scoreRange || '1-5'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Tag definition and usage guidelines..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  defaultValue={selectedTag?.description || ''}
                />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
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
                  defaultValue={selectedRule?.name || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What does this rule do?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  defaultValue={selectedRule?.description || ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag to Monitor</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
                    <option value="">Select a tag...</option>
                    {tags.map(t => (
                      <option key={t.id} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affects Dimension</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
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
                    defaultValue={selectedRule?.scoreAdjustment || 0}
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
                    defaultValue={selectedRule?.weight || 1.0}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
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
