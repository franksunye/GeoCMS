# 📊 信号与标签对照表 v5.0

## 📋 表格说明
- **Signal (事件级信号)**：通话中具体事件的识别，用于记录"发生了什么"
- **Tag (通话级标签)**：信号的聚合与质量评估，用于评估"做得好不好"
- **Category/Dimension**：保持与原始结构一致
- **Score Logic**：标签评分逻辑说明

---

## 📈 完整对照表

### **A. Sales（销售方）**

| Type | Code | Name (中文) | Category | Dimension | Aggregation (信号→标签) | Score Logic (1-5分) |
|------|------|-------------|----------|-----------|------------------------|---------------------|
| Signal | opening_complete | 开场完成 | Sales | Process | → opening_complete (tag) | 开场质量：1分(差)-5分(优) |
| Signal | needs_identification_basic | 基础需求识别 | Sales | Process | 聚合到 needs_identification | 需求识别质量 |
| Signal | needs_identification_deep | 深度需求识别 | Sales | Process | 聚合到 needs_identification | 需求识别质量 |
| **Tag** | **needs_identification** | **需求识别** | **Sales** | **Process** | **(聚合标签)** | **1分:基本询问 3分:系统询问 5分:深入全面** |
| Signal | solution_proposal_basic | 基础方案提议 | Sales | Process | → solution_proposal_basic (tag) | 方案提议质量 |
| **Tag** | **solution_proposal_basic** | **基础方案提议** | **Sales** | **Process** | **(直接映射)** | **1分:简单建议 3分:合理方案 5分:专业方案** |
| Signal | solution_proposal_professional | 专业方案提议 | Sales | Process | → solution_proposal_professional (tag) | 方案提议质量 |
| **Tag** | **solution_proposal_professional** | **专业方案提议** | **Sales** | **Process** | **(直接映射)** | **1分:普通专业 3分:较好专业 5分:非常专业** |
| Signal | schedule_attempt | 尝试安排时间 | Sales | Process | → schedule_attempt (tag) | 排程质量 |
| **Tag** | **schedule_attempt** | **尝试安排时间** | **Sales** | **Process** | **(直接映射)** | **1分:简单询问 3分:有效安排 5分:专业高效** |
| Signal | same_day_visit_attempt | 尝试当天上门 | Sales | Process | → same_day_visit_attempt (tag) | 上门尝试质量 |
| **Tag** | **same_day_visit_attempt** | **尝试当天上门** | **Sales** | **Process** | **(直接映射)** | **1分:简单提议 3分:有效提议 5分:成功安排** |
| Signal | handover_process_explained | 解释交接流程 | Sales | Process | → handover_process_explained (tag) | 交接解释质量 |
| **Tag** | **handover_process_explained** | **解释交接流程** | **Sales** | **Process** | **(直接映射)** | **1分:简单说明 3分:清晰说明 5分:详细专业** |
| Signal | active_selling_proposition | 主动销售主张 | Sales | Skills | → active_selling_proposition (tag) | 销售主张强度 |
| **Tag** | **active_selling_proposition** | **主动销售主张** | **Sales** | **Skills** | **(直接映射)** | **1分:微弱 3分:中等 5分:强烈** |
| Signal | objection_prevention_proactive | 主动异议预防 | Sales | Skills | → expectation_setting (tag) | 期望设定强度 |
| **Tag** | **expectation_setting** | **期望值设定** | **Sales** | **Skills** | **(直接映射)** | **1分:微弱 3分:中等 5分:强烈** |
| Signal | expectation_setting | 期望值设定 | Sales | Skills | → expectation_setting (tag) | 期望设定强度 |
| Signal | expertise_display | 专业知识展示 | Sales | Skills | → expertise_display (tag) | 专业知识强度 |
| **Tag** | **expertise_display** | **专业知识展示** | **Sales** | **Skills** | **(直接映射)** | **1分:微弱 3分:中等 5分:强烈** |
| Signal | skill_handle_objection_basic | 处理基础异议 | Sales | Skills | 聚合到 objection_handled | 异议处理质量 |
| Signal | skill_handle_objection_price | 处理价格异议 | Sales | Skills | 聚合到 objection_handled | 异议处理质量 |
| Signal | skill_handle_objection_time | 处理时间异议 | Sales | Skills | 聚合到 objection_handled | 异议处理质量 |
| Signal | skill_handle_objection_scope | 处理范围异议 | Sales | Skills | 聚合到 objection_handled | 异议处理质量 |
| Signal | skill_handle_objection_risk | 处理风险异议 | Sales | Skills | 聚合到 objection_handled | 异议处理质量 |
| Signal | skill_handle_objection_trust | 处理信任异议 | Sales | Skills | 聚合到 objection_handled | 异议处理质量 |
| **Tag** | **objection_handled** | **异议已处理** | **Sales** | **Skills** | **(聚合标签)** | **1分:处理差 3分:处理合格 5分:处理优秀** |
| Signal | listening_good | 良好倾听 | Sales | Communication | → listening_good (tag) | 倾听质量 |
| **Tag** | **listening_good** | **良好倾听** | **Sales** | **Communication** | **(直接映射)** | **1分:差 3分:合格 5分:优秀** |
| Signal | empathy_response | 共情回应 | Sales | Communication | → empathy_shown (tag) | 共情强度 |
| **Tag** | **empathy_shown** | **共情已展示** | **Sales** | **Communication** | **(名称转换)** | **1分:微弱 3分:中等 5分:强烈** |
| Signal | clarity_of_explanation | 清晰解释 | Sales | Communication | → clear_explanation (tag) | 解释清晰度 |
| **Tag** | **clear_explanation** | **清晰解释** | **Sales** | **Communication** | **(名称转换)** | **1分:模糊 3分:清晰 5分:非常清晰** |
| Signal | tone_professional | 专业语气 | Sales | Communication | → professional_tone (tag) | 语气专业度 |
| **Tag** | **professional_tone** | **专业语气** | **Sales** | **Communication** | **(名称转换)** | **1分:不专业 3分:专业 5分:非常专业** |
| Signal | attitude_positive | 积极态度 | Sales | Communication | → attitude_positive (tag) | 态度积极性 |
| **Tag** | **attitude_positive** | **积极态度** | **Sales** | **Communication** | **(直接映射)** | **1分:消极 3分:积极 5分:非常积极** |

---

### **B. Customer（客户方）**

| Type | Code | Name (中文) | Category | Dimension | Aggregation (信号→标签) | Score Logic (1-5分) |
|------|------|-------------|----------|-----------|------------------------|---------------------|
| Signal | customer_high_intent | 高意向 | Customer | Intent | → customer_high_intent (tag) | 意向强度 |
| **Tag** | **customer_high_intent** | **高意向** | **Customer** | **Intent** | **(直接映射)** | **1分:低意向 3分:中等意向 5分:高意向** |
| Signal | customer_solution_request | 解决方案请求 | Customer | Intent | → customer_solution_request (tag) | 请求强度 |
| **Tag** | **customer_solution_request** | **解决方案请求** | **Customer** | **Intent** | **(直接映射)** | **1分:微弱 3分:中等 5分:强烈** |
| Signal | customer_pricing_request | 价格询问 | Customer | Intent | → customer_pricing_request (tag) | 询问强度 |
| **Tag** | **customer_pricing_request** | **价格询问** | **Customer** | **Intent** | **(直接映射)** | **1分:随口问 3分:认真问 5分:急切问** |
| Signal | customer_schedule_request | 时间安排请求 | Customer | Intent | → customer_schedule_request (tag) | 请求强度 |
| **Tag** | **customer_schedule_request** | **时间安排请求** | **Customer** | **Intent** | **(直接映射)** | **1分:随意提 3分:认真提 5分:急切提** |
| Signal | customer_role_owner | 客户是业主/决策者 | Customer | Constraint | → customer_role_owner (tag) | 约束影响度 |
| **Tag** | **customer_role_owner** | **客户是业主/决策者** | **Customer** | **Constraint** | **(直接映射)** | **1分:轻微影响 3分:中等影响 5分:严重影响** |
| Signal | customer_objection_price | 价格异议 | Customer | Constraint | → customer_objection_price (tag) | 异议强度 |
| **Tag** | **customer_objection_price** | **价格异议** | **Customer** | **Constraint** | **(直接映射)** | **1分:轻微 3分:中等 5分:强烈** |
| Signal | customer_objection_time | 时间异议 | Customer | Constraint | → customer_objection_time (tag) | 异议强度 |
| **Tag** | **customer_objection_time** | **时间异议** | **Customer** | **Constraint** | **(直接映射)** | **1分:轻微 3分:中等 5分:强烈** |
| Signal | customer_objection_trust | 信任异议 | Customer | Constraint | → customer_objection_trust (tag) | 异议强度 |
| **Tag** | **customer_objection_trust** | **信任异议** | **Customer** | **Constraint** | **(直接映射)** | **1分:轻微 3分:中等 5分:强烈** |
| Signal | customer_objection_scope | 范围异议 | Customer | Constraint | → customer_objection_scope (tag) | 异议强度 |
| **Tag** | **customer_objection_scope** | **范围异议** | **Customer** | **Constraint** | **(直接映射)** | **1分:轻微 3分:中等 5分:强烈** |

---

### **C. Service Issue（服务问题）**

| Type | Code | Name (中文) | Category | Dimension | Aggregation (信号→标签) | Score Logic (1-5分) |
|------|------|-------------|----------|-----------|------------------------|---------------------|
| Signal | schedule_delay_customer_reason | 客户原因导致的排期延迟 | Service Issue | Service Issue | → service_delay_customer_reason (tag) | 问题严重度 + Severity(1-3) |
| **Tag** | **service_delay_customer_reason** | **客户原因导致的排期延迟** | **Service Issue** | **Service Issue** | **(名称转换)** | **1分:轻微延迟 3分:中等延迟 5分:严重延迟** |
| Signal | schedule_delay_agent_reason | 客服原因导致的排期延迟 | Service Issue | Service Issue | → service_delay_agent_reason (tag) | 问题严重度 + Severity(1-3) |
| **Tag** | **service_delay_agent_reason** | **客服原因导致的排期延迟** | **Service Issue** | **Service Issue** | **(名称转换)** | **1分:轻微延迟 3分:中等延迟 5分:严重延迟** |
| Signal | misalignment_price | 价格不一致 | Service Issue | Service Issue | → price_misalignment (tag) | 问题严重度 + Severity(1-3) |
| **Tag** | **price_misalignment** | **价格不一致** | **Service Issue** | **Service Issue** | **(名称转换)** | **1分:轻微差异 3分:中等差异 5分:严重差异** |
| Signal | misalignment_scope | 范围不一致 | Service Issue | Service Issue | → scope_misalignment (tag) | 问题严重度 + Severity(1-3) |
| **Tag** | **scope_misalignment** | **范围不一致** | **Service Issue** | **Service Issue** | **(名称转换)** | **1分:轻微差异 3分:中等差异 5分:严重差异** |
| Signal | communication_breakdown | 沟通中断 | Service Issue | Service Issue | → communication_breakdown (tag) | 问题严重度 + Severity(1-3) |
| **Tag** | **communication_breakdown** | **沟通中断** | **Service Issue** | **Service Issue** | **(直接映射)** | **1分:轻微中断 3分:中等中断 5分:严重中断** |
| Signal | risk_unaddressed | 风险未解决 | Service Issue | Service Issue | → risk_unaddressed (tag) | 问题严重度 + Severity(1-3) |
| **Tag** | **risk_unaddressed** | **风险未解决** | **Service Issue** | **Service Issue** | **(直接映射)** | **1分:轻微风险 3分:中等风险 5分:严重风险** |

---

## 📝 关键说明总结

### **1. 信号与标签的区别**
- **Signal (事件信号)**：记录具体行为**发生**（存在性判断）
- **Tag (通话标签)**：评估行为**质量/强度**（质量性判断）

### **2. 评分逻辑统一**
所有标签都使用 **1-5分** 评分，但评估维度不同：
- **流程类标签**：评估执行质量（完整性、专业性）
- **其他所有标签**：评估表现强度/问题严重度

### **3. 聚合规则类型**
1. **一对一映射**：Signal直接转为同名Tag
2. **名称转换**：Signal转为不同名称的Tag（如 tone_professional → professional_tone）
3. **多对一聚合**：多个Signal聚合为一个汇总Tag（如 所有needs_identification_* → needs_identification）
4. **异议处理聚合**：所有skill_handle_objection_* → objection_handled

### **4. 特殊字段说明**
- **Severity (严重程度)**：仅Service Issue标签需要1-3分（与Score独立）
- **Polarity (极性)**：
  - Sales类：positive
  - Customer.Intent：neutral（除customer_high_intent为positive）
  - Customer.Constraint：negative
  - Service Issue：negative

### **5. 使用示例**
```
销售说："你好" → opening_complete (signal触发)
质量评估：开场很差 → opening_complete tag score=1

客户说："明天上午行吗？" → customer_schedule_request (signal触发)
强度评估：明确具体时间 → customer_schedule_request tag score=5
```

---

这个表格清晰地展示了整个系统的逻辑结构，方便团队理解和使用。如果需要，我可以导出为Excel/CSV格式。