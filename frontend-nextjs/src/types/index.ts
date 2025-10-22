// Knowledge types
export interface Knowledge {
  id: number
  topic: string
  content: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateKnowledgeInput {
  topic: string
  content: Record<string, any>
}

export interface UpdateKnowledgeInput {
  topic?: string
  content?: Record<string, any>
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
  status: '待素材' | '已确认' | '进行中' | '已完成'
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
  status: '待编辑' | '已编辑' | '待审核' | '已批准' | '已发布'
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

