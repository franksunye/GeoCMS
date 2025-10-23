// Knowledge types
export interface Knowledge {
  id: number
  topic: string
  content: Record<string, any>
  description?: string
  tags?: string[]
  reference_count?: number
  last_used_at?: string
  quality_score?: number
  is_archived?: boolean
  created_at: string
  updated_at: string
  days_since_update?: number
}

export interface CreateKnowledgeInput {
  topic: string
  content: Record<string, any>
  description?: string
  tags?: string[]
}

export interface UpdateKnowledgeInput {
  topic?: string
  content?: Record<string, any>
  description?: string
  tags?: string[]
}

export interface KnowledgeUsageStats {
  total_references: number
  last_used_at: string | null
  recent_usage_30d: number
  usage_trend: Array<{
    date: string
    count: number
  }>
}

export interface KnowledgeQualityScore {
  knowledge_id: number
  quality_score: number
  completeness: string
  usage_level: string
  timeliness: string
}

// Plan types
export interface Plan {
  id: number
  user_id: string
  topic: string
  title: string
  keywords: string[]
  outline: {
    introduction: string
    main_points: string[]
    conclusion: string
  }
  category: string
  tags: string[]
  target_metric: {
    views?: number
    ctr?: number
    shares?: number
    leads?: number
    completion_rate?: number
    activation?: number
  }
  asset_requirements: string[]
  assets_provided: string[]
  material_pack_id: string
  status: 'pending_materials' | 'confirmed' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface CreatePlanInput {
  topic: string
  title: string
  keywords: string[]
  outline: {
    introduction: string
    main_points: string[]
    conclusion: string
  }
  category: string
  tags: string[]
  target_metric?: Record<string, number>
  asset_requirements?: string[]
}

export interface UpdatePlanInput {
  topic?: string
  title?: string
  keywords?: string[]
  outline?: {
    introduction: string
    main_points: string[]
    conclusion: string
  }
  category?: string
  tags?: string[]
  target_metric?: Record<string, number>
  asset_requirements?: string[]
  assets_provided?: string[]
  status?: Plan['status']
}

// Draft types
export interface Draft {
  id: number
  plan_id: number
  format: 'markdown' | 'html'
  content: string
  metadata: {
    title: string
    keywords: string[]
    word_count: number
    estimated_reading_time: string
    seo_score?: number
    readability_score?: number
  }
  status: 'pending_edit' | 'edited' | 'pending_review' | 'approved' | 'published'
  version: number
  reviewer_id: string | null
  reviewer_feedback: string | null
  created_at: string
  updated_at: string
}

export interface CreateDraftInput {
  plan_id: number
  format?: 'markdown' | 'html'
  content: string
  metadata: {
    title: string
    keywords: string[]
    word_count: number
    estimated_reading_time: string
  }
}

export interface UpdateDraftInput {
  content?: string
  metadata?: Partial<Draft['metadata']>
  status?: Draft['status']
  reviewer_feedback?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

// Stats types
export interface Stats {
  totalKnowledge: number
  totalPlans: number
  totalDrafts: number
  publishedContent: number
  plansByStatus: Record<string, number>
  draftsByStatus: Record<string, number>
}

// Agent types
export interface AgentTask {
  id: number
  run_id: number
  task_type: string
  task_data: Record<string, any>
  result: Record<string, any> | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface AgentRun {
  id: number
  user_intent: string
  state: Record<string, any>
  status: 'active' | 'completed' | 'failed'
  progress: number
  created_at: string
  updated_at: string
  tasks?: AgentTask[]
}

export interface AgentRunList {
  total: number
  active_count: number
  completed_count: number
  failed_count: number
  runs: AgentRun[]
}

export interface AgentStats {
  runs: {
    total: number
    active: number
    completed: number
    failed: number
  }
  tasks: {
    total: number
    pending: number
    completed: number
    failed: number
  }
}

// Agent Team types
export type AgentId = 'knowledge' | 'planner' | 'writer' | 'verifier'
export type AgentStatus = 'active' | 'idle' | 'scheduled' | 'waiting'

export interface AgentStatusData {
  agentId: AgentId
  status: AgentStatus
  currentTask?: {
    id: number
    type: string
    startedAt: string
  }
  queuedTasks: number
  nextScheduledTime?: string
  todayCompleted: number
}

export interface ActivityItem {
  id: number
  type: 'agent' | 'user' | 'system'
  actor: {
    id: string
    name: string
    avatar?: string
  }
  action: string
  target: {
    type: 'knowledge' | 'plan' | 'draft' | 'task'
    id: number
    title: string
  }
  timestamp: string
  metadata?: Record<string, any>
}

