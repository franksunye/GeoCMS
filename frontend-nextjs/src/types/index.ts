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

// Agent RunList types
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

// Media types
export interface Media {
  id: number
  filename: string
  type: 'image' | 'video' | 'document'
  url: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  tags?: string[]
  description?: string
  uploadedAt: string
  usedIn?: Array<{
    type: 'plan' | 'draft'
    id: number
    title: string
  }>
}

export interface CreateMediaInput {
  filename: string
  type: 'image' | 'video' | 'document'
  url: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  tags?: string[]
  description?: string
}

export interface UpdateMediaInput {
  filename?: string
  tags?: string[]
  description?: string
}

// Publishing types
export interface Publishing {
  id: number
  draft_id: number
  status: 'draft' | 'pending_review' | 'published' | 'archived'
  channel: 'blog' | 'website' | 'social'
  publish_time?: string
  published_at?: string
  published_by?: string
  checklist: {
    title_checked: boolean
    keywords_checked: boolean
    media_checked: boolean
    content_length_checked: boolean
    seo_checked: boolean
  }
  history: Array<{
    status: string
    timestamp: string
    actor: string
  }>
  created_at: string
  updated_at: string
}

export interface CreatePublishingInput {
  draft_id: number
  channel: 'blog' | 'website' | 'social'
  publish_time?: string
}

export interface UpdatePublishingInput {
  status?: Publishing['status']
  channel?: Publishing['channel']
  publish_time?: string
  checklist?: Partial<Publishing['checklist']>
}

// Template types
export interface Template {
  id: number
  name: string
  category: 'blog' | 'website' | 'product' | 'faq' | 'custom'
  description?: string
  structure: {
    sections: string[]
    variables: string[]
  }
  content_template?: string
  tags?: string[]
  usage_count?: number
  created_at: string
  updated_at: string
}

export interface CreateTemplateInput {
  name: string
  category: 'blog' | 'website' | 'product' | 'faq' | 'custom'
  description?: string
  structure: {
    sections: string[]
    variables: string[]
  }
  content_template?: string
  tags?: string[]
}

export interface UpdateTemplateInput {
  name?: string
  category?: Template['category']
  description?: string
  structure?: Template['structure']
  content_template?: string
  tags?: string[]
}

// Agent types
export interface AgentRun {
  id: string | number
  user_intent: string
  state: {
    current_step: string
    plan_id?: number
    draft_id?: number
    knowledge_used?: string[]
    conversation?: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
    error?: string
  }
  status: 'active' | 'completed' | 'failed'
  progress: number
  created_at: string
  updated_at: string
  tasks?: AgentTask[]
}

export interface AgentTask {
  id: number
  run_id: string | number
  task_type: string
  task_data: Record<string, any>
  result?: Record<string, any> | null
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  logs?: Array<{
    timestamp: string
    level: 'info' | 'warning' | 'error'
    message: string
  }>
}

export interface AgentRunStats {
  total_runs: number
  active_runs: number
  completed_runs: number
  failed_runs: number
  average_duration: number
}

// Category types
export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  parent_id?: number
  content_count?: number
  created_at: string
  updated_at: string
}

export interface CreateCategoryInput {
  name: string
  slug: string
  description?: string
  parent_id?: number
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string
  parent_id?: number
}

// Tag types
export interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  usage_count?: number
  created_at: string
  updated_at: string
}

export interface CreateTagInput {
  name: string
  slug: string
  description?: string
}

export interface UpdateTagInput {
  name?: string
  slug?: string
  description?: string
}

// Settings types
export interface BrandSettings {
  brand_voice: string
  keywords: string[]
  style_guide: string
}

export interface AISettings {
  model: string
  temperature: number
  max_tokens: number
  top_p: number
}

export interface PublishingSettings {
  default_category_id?: number
  default_status: string
  channels: string[]
}

export interface SystemSettings {
  language: string
  timezone: string
  notifications_enabled: boolean
}

export interface AllSettings {
  brand: BrandSettings
  ai: AISettings
  publishing: PublishingSettings
  system: SystemSettings
}

// Calendar types
export interface CalendarEvent {
  id: number
  content_id: number
  content_title: string
  publish_date: string
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  category_id?: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface CreateCalendarEventInput {
  content_id: number
  publish_date: string
  status: string
}

export interface UpdateCalendarEventInput {
  publish_date?: string
  status?: string
}
