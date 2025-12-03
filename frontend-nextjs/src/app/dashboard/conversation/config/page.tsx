'use client'

import { Settings, Save, RotateCcw, Plus, Edit2, Trash2, Eye, MoreHorizontal, Clock, User, Copy } from 'lucide-react'
import { useState } from 'react'

type Tab = 'tags' | 'rules' | 'scoring' | 'history'

type Tag = {
  id: string
  name: string
  code: string
  category: 'Objection' | 'Intent' | 'RiskFactor' | 'Behavior' | 'Other'
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
  tagCode: string                    // 监听的标签代码，如 'price_objection'
  targetDimension: 'risk' | 'opportunity' | 'execution'  // 影响的维度
  scoreAdjustment: number            // 分数调整值（-100 到 +100）
  weight: number                     // 权重乘数（0.5-2.0）
  createdAt: string
  updatedAt: string
}

type ScoreCalculationConfig = {
  id: string
  aggregationMethod: 'weighted-average' | 'custom'  // 聚合方式
  riskWeight: number                 // Risk 权重百分比（0-100）
  opportunityWeight: number          // Opportunity 权重百分比（0-100）
  executionWeight: number            // Execution 权重百分比（0-100）
  customFormula?: string             // 自定义公式（如需要）
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

// Mock data
const mockTags: Tag[] = [
  {
    id: '1',
    name: 'Price Objection',
    code: 'price_objection',
    category: 'Objection',
    description: 'Customer raised concerns about pricing',
    active: true,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '2',
    name: 'High Purchase Intent',
    code: 'intent_positive',
    category: 'Intent',
    description: 'Clear indication of purchase intent',
    active: true,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '3',
    name: 'Competitor Mention',
    code: 'competitor_mention',
    category: 'RiskFactor',
    description: 'Competitor was mentioned during the call',
    active: true,
    createdAt: '2025-12-02',
    updatedAt: '2025-12-02',
  },
]

const mockRules: ScoringRule[] = [
  {
    id: '1',
    name: 'High Purchase Intent',
    appliesTo: 'Calls',
    description: 'When customer shows clear purchase intent, boost opportunity score',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'intent_positive',
    targetDimension: 'opportunity',
    scoreAdjustment: 25,
    weight: 1.2,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '2',
    name: 'Price Objection Risk',
    appliesTo: 'Calls',
    description: 'When customer raises price concerns, increase risk score',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'price_objection',
    targetDimension: 'risk',
    scoreAdjustment: 30,
    weight: 0.8,
    createdAt: '2025-12-02',
    updatedAt: '2025-12-02',
  },
  {
    id: '3',
    name: 'Competitor Mention',
    appliesTo: 'Calls',
    description: 'When competitor is mentioned, increase risk score',
    active: true,
    ruleType: 'TagBased',
    tagCode: 'competitor_mention',
    targetDimension: 'risk',
    scoreAdjustment: 20,
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
    details: 'Code: competitor_mention, Category: RiskFactor',
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
  riskWeight: 30,
  opportunityWeight: 50,
  executionWeight: 20,
  description: 'Default score calculation: balanced emphasis on opportunity',
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
  
  // Tag form state
  const [tagForm, setTagForm] = useState({ name: '', code: '', category: 'Other' as const, description: '', active: true })
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({ name: '', description: '', tagCode: '', targetDimension: 'risk' as const, scoreAdjustment: 0, weight: 1.0, active: true })
  
  // Score config form state
  const [scoreForm, setScoreForm] = useState({ riskWeight: 30, opportunityWeight: 50, executionWeight: 20 })

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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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

          {/* Tags Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tag.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{tag.code}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag.category}
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
                        {rule.targetDimension === 'risk' && '📍 Risk'}
                        {rule.targetDimension === 'opportunity' && '🎯 Opportunity'}
                        {rule.targetDimension === 'execution' && '⚙️ Execution'}
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
                <p className="text-xs text-gray-500 ml-7">overallScore = (risk × weight) + (opportunity × weight) + (execution × weight)</p>
              </div>
            </div>

            {/* Weight Configuration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Score Weights</h3>
              <p className="text-xs text-gray-500 mb-4">Adjust how each dimension contributes to the overall score (total must equal 100%)</p>
              
              <div className="space-y-5">
                {/* Risk Weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">📍 Risk Score Weight</label>
                    <span className="text-sm font-semibold text-gray-900">{scoreForm.riskWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm.riskWeight}
                    onChange={(e) => {
                      const newRisk = parseInt(e.target.value)
                      const available = 100 - newRisk
                      setScoreForm({
                        ...scoreForm,
                        riskWeight: newRisk,
                        opportunityWeight: Math.min(scoreForm.opportunityWeight, available),
                      })
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Opportunity Weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">🎯 Opportunity Score Weight</label>
                    <span className="text-sm font-semibold text-gray-900">{scoreForm.opportunityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm.opportunityWeight}
                    onChange={(e) => {
                      const newOpp = parseInt(e.target.value)
                      const available = 100 - newOpp
                      setScoreForm({
                        ...scoreForm,
                        opportunityWeight: newOpp,
                        executionWeight: Math.min(scoreForm.executionWeight, available),
                      })
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Execution Weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">⚙️ Execution Score Weight</label>
                    <span className="text-sm font-semibold text-gray-900">{scoreForm.executionWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm.executionWeight}
                    onChange={(e) => setScoreForm({ ...scoreForm, executionWeight: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Total Display */}
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium">Total Weight</p>
                  <p className={`text-lg font-bold ${scoreForm.riskWeight + scoreForm.opportunityWeight + scoreForm.executionWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreForm.riskWeight + scoreForm.opportunityWeight + scoreForm.executionWeight}%
                  </p>
                </div>
              </div>
            </div>

            {/* Formula Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Formula Preview</h4>
              <code className="text-sm text-blue-800 font-mono block p-3 bg-white rounded border border-blue-100">
                overallScore = (risk × {(scoreForm.riskWeight / 100).toFixed(2)}) + (opportunity × {(scoreForm.opportunityWeight / 100).toFixed(2)}) + (execution × {(scoreForm.executionWeight / 100).toFixed(2)})
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="Objection">Objection</option>
                  <option value="Intent">Intent</option>
                  <option value="RiskFactor">RiskFactor</option>
                  <option value="Behavior">Behavior</option>
                  <option value="Other">Other</option>
                </select>
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
                    <option value="risk">📍 Risk Score</option>
                    <option value="opportunity">🎯 Opportunity Score</option>
                    <option value="execution">⚙️ Execution Score</option>
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
                    {selectedRule.targetDimension === 'risk' && '📍 Risk'}
                    {selectedRule.targetDimension === 'opportunity' && '🎯 Opportunity'}
                    {selectedRule.targetDimension === 'execution' && '⚙️ Execution'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-600 font-medium uppercase">Adjustment</p>
                  <p className={`text-lg font-bold mt-1 ${selectedRule.scoreAdjustment > 0 ? 'text-green-600' : selectedRule.scoreAdjustment < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {selectedRule.scoreAdjustment > 0 ? '+' : ''}{selectedRule.scoreAdjustment}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium uppercase">Weight</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{selectedRule.weight.toFixed(1)}x</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Effect:</strong> When this rule matches, the <strong>{selectedRule.targetDimension}</strong> score will be adjusted by <strong>{selectedRule.scoreAdjustment > 0 ? '+' : ''}{selectedRule.scoreAdjustment}</strong> with a weight multiplier of <strong>{selectedRule.weight.toFixed(1)}x</strong>.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
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
