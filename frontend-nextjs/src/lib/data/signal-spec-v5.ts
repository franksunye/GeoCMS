
export interface SignalDefinition {
  type: 'Signal';
  code: string;
  name: string;
  category: string;
  dimension: string;
  aggregation: string;
  targetTagCode: string; // Derived from aggregation
  scoreLogic: string;
}

export interface TagDefinition {
  type: 'Tag';
  code: string;
  name: string;
  category: string;
  dimension: string;
  description: string;
  scoreLogic: string;
}

export const SIGNALS: SignalDefinition[] = [
  // Sales - Process
  { type: 'Signal', code: 'opening_complete', name: '开场完成', category: 'Sales', dimension: 'Process', aggregation: '→ opening_complete (tag)', targetTagCode: 'opening_complete', scoreLogic: '开场质量：1分(差)-5分(优)' },
  { type: 'Signal', code: 'needs_identification_basic', name: '基础需求识别', category: 'Sales', dimension: 'Process', aggregation: '聚合到 needs_identification', targetTagCode: 'needs_identification', scoreLogic: '需求识别质量' },
  { type: 'Signal', code: 'needs_identification_deep', name: '深度需求识别', category: 'Sales', dimension: 'Process', aggregation: '聚合到 needs_identification', targetTagCode: 'needs_identification', scoreLogic: '需求识别质量' },
  { type: 'Signal', code: 'solution_proposal_basic', name: '基础方案提议', category: 'Sales', dimension: 'Process', aggregation: '→ solution_proposal_basic (tag)', targetTagCode: 'solution_proposal_basic', scoreLogic: '方案提议质量' },
  { type: 'Signal', code: 'solution_proposal_professional', name: '专业方案提议', category: 'Sales', dimension: 'Process', aggregation: '→ solution_proposal_professional (tag)', targetTagCode: 'solution_proposal_professional', scoreLogic: '方案提议质量' },
  { type: 'Signal', code: 'schedule_attempt', name: '尝试安排时间', category: 'Sales', dimension: 'Process', aggregation: '→ schedule_attempt (tag)', targetTagCode: 'schedule_attempt', scoreLogic: '排程质量' },
  { type: 'Signal', code: 'same_day_visit_attempt', name: '尝试当天上门', category: 'Sales', dimension: 'Process', aggregation: '→ same_day_visit_attempt (tag)', targetTagCode: 'same_day_visit_attempt', scoreLogic: '上门尝试质量' },
  { type: 'Signal', code: 'handover_process_explained', name: '解释交接流程', category: 'Sales', dimension: 'Process', aggregation: '→ handover_process_explained (tag)', targetTagCode: 'handover_process_explained', scoreLogic: '交接解释质量' },
  
  // Sales - Skills
  { type: 'Signal', code: 'active_selling_proposition', name: '主动销售主张', category: 'Sales', dimension: 'Skills', aggregation: '→ active_selling_proposition (tag)', targetTagCode: 'active_selling_proposition', scoreLogic: '销售主张强度' },
  { type: 'Signal', code: 'objection_prevention_proactive', name: '主动异议预防', category: 'Sales', dimension: 'Skills', aggregation: '→ expectation_setting (tag)', targetTagCode: 'expectation_setting', scoreLogic: '期望设定强度' },
  { type: 'Signal', code: 'expectation_setting', name: '期望值设定', category: 'Sales', dimension: 'Skills', aggregation: '→ expectation_setting (tag)', targetTagCode: 'expectation_setting', scoreLogic: '期望设定强度' },
  { type: 'Signal', code: 'expertise_display', name: '专业知识展示', category: 'Sales', dimension: 'Skills', aggregation: '→ expertise_display (tag)', targetTagCode: 'expertise_display', scoreLogic: '专业知识强度' },
  { type: 'Signal', code: 'skill_handle_objection_basic', name: '处理基础异议', category: 'Sales', dimension: 'Skills', aggregation: '聚合到 objection_handled', targetTagCode: 'objection_handled', scoreLogic: '异议处理质量' },
  { type: 'Signal', code: 'skill_handle_objection_price', name: '处理价格异议', category: 'Sales', dimension: 'Skills', aggregation: '聚合到 objection_handled', targetTagCode: 'objection_handled', scoreLogic: '异议处理质量' },
  { type: 'Signal', code: 'skill_handle_objection_time', name: '处理时间异议', category: 'Sales', dimension: 'Skills', aggregation: '聚合到 objection_handled', targetTagCode: 'objection_handled', scoreLogic: '异议处理质量' },
  { type: 'Signal', code: 'skill_handle_objection_scope', name: '处理范围异议', category: 'Sales', dimension: 'Skills', aggregation: '聚合到 objection_handled', targetTagCode: 'objection_handled', scoreLogic: '异议处理质量' },
  { type: 'Signal', code: 'skill_handle_objection_risk', name: '处理风险异议', category: 'Sales', dimension: 'Skills', aggregation: '聚合到 objection_handled', targetTagCode: 'objection_handled', scoreLogic: '异议处理质量' },
  { type: 'Signal', code: 'skill_handle_objection_trust', name: '处理信任异议', category: 'Sales', dimension: 'Skills', aggregation: '聚合到 objection_handled', targetTagCode: 'objection_handled', scoreLogic: '异议处理质量' },
  
  // Sales - Communication
  { type: 'Signal', code: 'listening_good', name: '良好倾听', category: 'Sales', dimension: 'Communication', aggregation: '→ listening_good (tag)', targetTagCode: 'listening_good', scoreLogic: '倾听质量' },
  { type: 'Signal', code: 'empathy_response', name: '共情回应', category: 'Sales', dimension: 'Communication', aggregation: '→ empathy_shown (tag)', targetTagCode: 'empathy_shown', scoreLogic: '共情强度' },
  { type: 'Signal', code: 'clarity_of_explanation', name: '清晰解释', category: 'Sales', dimension: 'Communication', aggregation: '→ clear_explanation (tag)', targetTagCode: 'clear_explanation', scoreLogic: '解释清晰度' },
  { type: 'Signal', code: 'tone_professional', name: '专业语气', category: 'Sales', dimension: 'Communication', aggregation: '→ professional_tone (tag)', targetTagCode: 'professional_tone', scoreLogic: '语气专业度' },
  { type: 'Signal', code: 'attitude_positive', name: '积极态度', category: 'Sales', dimension: 'Communication', aggregation: '→ attitude_positive (tag)', targetTagCode: 'attitude_positive', scoreLogic: '态度积极性' },

  // Customer - Intent
  { type: 'Signal', code: 'customer_high_intent', name: '高意向', category: 'Customer', dimension: 'Intent', aggregation: '→ customer_high_intent (tag)', targetTagCode: 'customer_high_intent', scoreLogic: '意向强度' },
  { type: 'Signal', code: 'customer_solution_request', name: '解决方案请求', category: 'Customer', dimension: 'Intent', aggregation: '→ customer_solution_request (tag)', targetTagCode: 'customer_solution_request', scoreLogic: '请求强度' },
  { type: 'Signal', code: 'customer_pricing_request', name: '价格询问', category: 'Customer', dimension: 'Intent', aggregation: '→ customer_pricing_request (tag)', targetTagCode: 'customer_pricing_request', scoreLogic: '询问强度' },
  { type: 'Signal', code: 'customer_schedule_request', name: '时间安排请求', category: 'Customer', dimension: 'Intent', aggregation: '→ customer_schedule_request (tag)', targetTagCode: 'customer_schedule_request', scoreLogic: '请求强度' },

  // Customer - Constraint
  { type: 'Signal', code: 'customer_role_owner', name: '客户是业主/决策者', category: 'Customer', dimension: 'Constraint', aggregation: '→ customer_role_owner (tag)', targetTagCode: 'customer_role_owner', scoreLogic: '约束影响度' },
  { type: 'Signal', code: 'customer_objection_price', name: '价格异议', category: 'Customer', dimension: 'Constraint', aggregation: '→ customer_objection_price (tag)', targetTagCode: 'customer_objection_price', scoreLogic: '异议强度' },
  { type: 'Signal', code: 'customer_objection_time', name: '时间异议', category: 'Customer', dimension: 'Constraint', aggregation: '→ customer_objection_time (tag)', targetTagCode: 'customer_objection_time', scoreLogic: '异议强度' },
  { type: 'Signal', code: 'customer_objection_trust', name: '信任异议', category: 'Customer', dimension: 'Constraint', aggregation: '→ customer_objection_trust (tag)', targetTagCode: 'customer_objection_trust', scoreLogic: '异议强度' },
  { type: 'Signal', code: 'customer_objection_scope', name: '范围异议', category: 'Customer', dimension: 'Constraint', aggregation: '→ customer_objection_scope (tag)', targetTagCode: 'customer_objection_scope', scoreLogic: '异议强度' },

  // Service Issue
  { type: 'Signal', code: 'schedule_delay_customer_reason', name: '客户原因导致的排期延迟', category: 'Service Issue', dimension: 'Service Issue', aggregation: '→ service_delay_customer_reason (tag)', targetTagCode: 'service_delay_customer_reason', scoreLogic: '问题严重度 + Severity(1-3)' },
  { type: 'Signal', code: 'schedule_delay_agent_reason', name: '客服原因导致的排期延迟', category: 'Service Issue', dimension: 'Service Issue', aggregation: '→ service_delay_agent_reason (tag)', targetTagCode: 'service_delay_agent_reason', scoreLogic: '问题严重度 + Severity(1-3)' },
  { type: 'Signal', code: 'misalignment_price', name: '价格不一致', category: 'Service Issue', dimension: 'Service Issue', aggregation: '→ price_misalignment (tag)', targetTagCode: 'price_misalignment', scoreLogic: '问题严重度 + Severity(1-3)' },
  { type: 'Signal', code: 'misalignment_scope', name: '范围不一致', category: 'Service Issue', dimension: 'Service Issue', aggregation: '→ scope_misalignment (tag)', targetTagCode: 'scope_misalignment', scoreLogic: '问题严重度 + Severity(1-3)' },
  { type: 'Signal', code: 'communication_breakdown', name: '沟通中断', category: 'Service Issue', dimension: 'Service Issue', aggregation: '→ communication_breakdown (tag)', targetTagCode: 'communication_breakdown', scoreLogic: '问题严重度 + Severity(1-3)' },
  { type: 'Signal', code: 'risk_unaddressed', name: '风险未解决', category: 'Service Issue', dimension: 'Service Issue', aggregation: '→ risk_unaddressed (tag)', targetTagCode: 'risk_unaddressed', scoreLogic: '问题严重度 + Severity(1-3)' },
];

export const TAGS: TagDefinition[] = [
  // Sales - Process
  { type: 'Tag', code: 'needs_identification', name: '需求识别', category: 'Sales', dimension: 'Process', description: '(聚合标签)', scoreLogic: '1分:基本询问 3分:系统询问 5分:深入全面' },
  { type: 'Tag', code: 'solution_proposal_basic', name: '基础方案提议', category: 'Sales', dimension: 'Process', description: '(直接映射)', scoreLogic: '1分:简单建议 3分:合理方案 5分:专业方案' },
  { type: 'Tag', code: 'solution_proposal_professional', name: '专业方案提议', category: 'Sales', dimension: 'Process', description: '(直接映射)', scoreLogic: '1分:普通专业 3分:较好专业 5分:非常专业' },
  { type: 'Tag', code: 'schedule_attempt', name: '尝试安排时间', category: 'Sales', dimension: 'Process', description: '(直接映射)', scoreLogic: '1分:简单询问 3分:有效安排 5分:专业高效' },
  { type: 'Tag', code: 'same_day_visit_attempt', name: '尝试当天上门', category: 'Sales', dimension: 'Process', description: '(直接映射)', scoreLogic: '1分:简单提议 3分:有效提议 5分:成功安排' },
  { type: 'Tag', code: 'handover_process_explained', name: '解释交接流程', category: 'Sales', dimension: 'Process', description: '(直接映射)', scoreLogic: '1分:简单说明 3分:清晰说明 5分:详细专业' },
  { type: 'Tag', code: 'opening_complete', name: '开场完成', category: 'Sales', dimension: 'Process', description: '(直接映射)', scoreLogic: '开场质量：1分(差)-5分(优)' }, // Added based on signal 1-to-1

  // Sales - Skills
  { type: 'Tag', code: 'active_selling_proposition', name: '主动销售主张', category: 'Sales', dimension: 'Skills', description: '(直接映射)', scoreLogic: '1分:微弱 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'expectation_setting', name: '期望值设定', category: 'Sales', dimension: 'Skills', description: '(直接映射)', scoreLogic: '1分:微弱 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'expertise_display', name: '专业知识展示', category: 'Sales', dimension: 'Skills', description: '(直接映射)', scoreLogic: '1分:微弱 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'objection_handled', name: '异议已处理', category: 'Sales', dimension: 'Skills', description: '(聚合标签)', scoreLogic: '1分:处理差 3分:处理合格 5分:处理优秀' },

  // Sales - Communication
  { type: 'Tag', code: 'listening_good', name: '良好倾听', category: 'Sales', dimension: 'Communication', description: '(直接映射)', scoreLogic: '1分:差 3分:合格 5分:优秀' },
  { type: 'Tag', code: 'empathy_shown', name: '共情已展示', category: 'Sales', dimension: 'Communication', description: '(名称转换)', scoreLogic: '1分:微弱 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'clear_explanation', name: '清晰解释', category: 'Sales', dimension: 'Communication', description: '(名称转换)', scoreLogic: '1分:模糊 3分:清晰 5分:非常清晰' },
  { type: 'Tag', code: 'professional_tone', name: '专业语气', category: 'Sales', dimension: 'Communication', description: '(名称转换)', scoreLogic: '1分:不专业 3分:专业 5分:非常专业' },
  { type: 'Tag', code: 'attitude_positive', name: '积极态度', category: 'Sales', dimension: 'Communication', description: '(直接映射)', scoreLogic: '1分:消极 3分:积极 5分:非常积极' },

  // Customer - Intent
  { type: 'Tag', code: 'customer_high_intent', name: '高意向', category: 'Customer', dimension: 'Intent', description: '(直接映射)', scoreLogic: '1分:低意向 3分:中等意向 5分:高意向' },
  { type: 'Tag', code: 'customer_solution_request', name: '解决方案请求', category: 'Customer', dimension: 'Intent', description: '(直接映射)', scoreLogic: '1分:微弱 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'customer_pricing_request', name: '价格询问', category: 'Customer', dimension: 'Intent', description: '(直接映射)', scoreLogic: '1分:随口问 3分:认真问 5分:急切问' },
  { type: 'Tag', code: 'customer_schedule_request', name: '时间安排请求', category: 'Customer', dimension: 'Intent', description: '(直接映射)', scoreLogic: '1分:随意提 3分:认真提 5分:急切提' },

  // Customer - Constraint
  { type: 'Tag', code: 'customer_role_owner', name: '客户是业主/决策者', category: 'Customer', dimension: 'Constraint', description: '(直接映射)', scoreLogic: '1分:轻微影响 3分:中等影响 5分:严重影响' },
  { type: 'Tag', code: 'customer_objection_price', name: '价格异议', category: 'Customer', dimension: 'Constraint', description: '(直接映射)', scoreLogic: '1分:轻微 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'customer_objection_time', name: '时间异议', category: 'Customer', dimension: 'Constraint', description: '(直接映射)', scoreLogic: '1分:轻微 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'customer_objection_trust', name: '信任异议', category: 'Customer', dimension: 'Constraint', description: '(直接映射)', scoreLogic: '1分:轻微 3分:中等 5分:强烈' },
  { type: 'Tag', code: 'customer_objection_scope', name: '范围异议', category: 'Customer', dimension: 'Constraint', description: '(直接映射)', scoreLogic: '1分:轻微 3分:中等 5分:强烈' },

  // Service Issue
  { type: 'Tag', code: 'service_delay_customer_reason', name: '客户原因导致的排期延迟', category: 'Service Issue', dimension: 'Service Issue', description: '(名称转换)', scoreLogic: '1分:轻微延迟 3分:中等延迟 5分:严重延迟' },
  { type: 'Tag', code: 'service_delay_agent_reason', name: '客服原因导致的排期延迟', category: 'Service Issue', dimension: 'Service Issue', description: '(名称转换)', scoreLogic: '1分:轻微延迟 3分:中等延迟 5分:严重延迟' },
  { type: 'Tag', code: 'price_misalignment', name: '价格不一致', category: 'Service Issue', dimension: 'Service Issue', description: '(名称转换)', scoreLogic: '1分:轻微差异 3分:中等差异 5分:严重差异' },
  { type: 'Tag', code: 'scope_misalignment', name: '范围不一致', category: 'Service Issue', dimension: 'Service Issue', description: '(名称转换)', scoreLogic: '1分:轻微差异 3分:中等差异 5分:严重差异' },
  { type: 'Tag', code: 'communication_breakdown', name: '沟通中断', category: 'Service Issue', dimension: 'Service Issue', description: '(直接映射)', scoreLogic: '1分:轻微中断 3分:中等中断 5分:严重中断' },
  { type: 'Tag', code: 'risk_unaddressed', name: '风险未解决', category: 'Service Issue', dimension: 'Service Issue', description: '(直接映射)', scoreLogic: '1分:轻微风险 3分:中等风险 5分:严重风险' },
];
