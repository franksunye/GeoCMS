# GeoCMS AI Native 升级计划

## 🎯 升级目标

将当前的GeoCMS PoC升级为"AI Native"的多Agent系统，实现：

1. **动态流程控制**：Planner Agent决定下一步行动，不再依赖前端固定流程
2. **多角色协同**：Planner → Writer → Verifier的完整闭环
3. **状态追踪管理**：基于`planner_runs.state`的会话状态管理
4. **知识驱动增强**：深度集成现有知识库，实现知识感知的智能生成

## 📊 当前项目状态

### ✅ 已完成功能
- 完整的知识库系统（数据层、业务层、API层、前端层）
- 基础AI代理架构（Planner + Writer）
- 知识感知内容生成
- 缺失知识检测和引导
- 98个测试，100%通过率

### 🔄 需要升级的部分
- 状态驱动的流程控制
- 多Agent协同机制
- System Prompt管理
- 会话状态追踪
- Verifier Agent（可选）

## 🏗 架构升级设计

### 新增数据模型

#### 1. PlannerRuns（会话管理）
```sql
CREATE TABLE planner_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_intent TEXT NOT NULL,           -- 用户原始意图
    state JSON NOT NULL,                 -- 当前状态槽位
    status VARCHAR(50) DEFAULT 'active', -- active/completed/failed
    created_at DATETIME,
    updated_at DATETIME
);
```

#### 2. PlannerTasks（任务管理）
```sql
CREATE TABLE planner_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER REFERENCES planner_runs(id),
    task_type VARCHAR(50) NOT NULL,      -- ask_slot/generate_content/verify
    task_data JSON NOT NULL,             -- 任务具体数据
    result JSON,                         -- 任务执行结果
    status VARCHAR(50) DEFAULT 'pending', -- pending/completed/failed
    created_at DATETIME,
    updated_at DATETIME
);
```

#### 3. VerifierLogs（校验记录，可选）
```sql
CREATE TABLE verifier_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_block_id INTEGER REFERENCES content_blocks(id),
    verification_result JSON NOT NULL,    -- 校验结果
    issues_found JSON,                   -- 发现的问题
    suggestions JSON,                    -- 改进建议
    created_at DATETIME
);
```

### System Prompt管理

#### 文件结构
```
prompts/
├── planner_agent.json      # Planner Agent系统提示词
├── writer_agent.json       # Writer Agent系统提示词
├── verifier_agent.json     # Verifier Agent系统提示词（可选）
└── templates/              # 提示词模板
    ├── ask_slot.json       # 询问槽位模板
    ├── plan_tasks.json     # 任务规划模板
    └── verify_content.json # 内容校验模板
```

#### Planner Agent Prompt结构
```json
{
  "system_prompt": "你是一个智能内容规划助手...",
  "decision_logic": {
    "ask_slot": "当缺少必要信息时，询问用户补充",
    "plan": "当信息充足时，制定内容生成计划"
  },
  "slot_definitions": {
    "site_type": "网站类型（企业官网/产品介绍/个人博客等）",
    "brand_name": "品牌或公司名称",
    "target_audience": "目标受众",
    "content_goals": "内容目标"
  }
}
```

## 📋 开发任务分解

### Phase 1: 数据模型扩展 (1-2天)
- [ ] **P1.1** 新增`PlannerRuns`模型
- [ ] **P1.2** 新增`PlannerTasks`模型  
- [ ] **P1.3** 新增`VerifierLogs`模型（可选）
- [ ] **P1.4** 数据库迁移脚本
- [ ] **P1.5** 更新数据模型测试

### Phase 2: System Prompt管理 (1天)
- [ ] **P2.1** 创建`prompts/`目录结构
- [ ] **P2.2** 设计Planner Agent提示词
- [ ] **P2.3** 设计Writer Agent提示词
- [ ] **P2.4** 设计Verifier Agent提示词（可选）
- [ ] **P2.5** 创建Prompt加载服务

### Phase 3: 状态驱动Planner升级 (2-3天)
- [ ] **P3.1** 重构Planner Agent支持状态驱动
- [ ] **P3.2** 实现`ask_slot`决策逻辑
- [ ] **P3.3** 实现`plan_tasks`决策逻辑
- [ ] **P3.4** 集成知识库查询到状态分析
- [ ] **P3.5** 状态管理服务开发

### Phase 4: 多Agent协同机制 (2天)
- [ ] **P4.1** 设计Agent协调器
- [ ] **P4.2** 实现Planner→Writer工作流
- [ ] **P4.3** 实现Writer→Verifier工作流（可选）
- [ ] **P4.4** 任务状态追踪机制
- [ ] **P4.5** 错误处理和回退机制

### Phase 5: API层升级 (1-2天)
- [ ] **P5.1** 新增`/api/next_action`端点
- [ ] **P5.2** 升级`/api/run-prompt`支持状态管理
- [ ] **P5.3** 新增会话管理API
- [ ] **P5.4** 新增任务查询API
- [ ] **P5.5** API文档更新

### Phase 6: 前端界面升级 (2天)
- [ ] **P6.1** 重构前端支持状态驱动交互
- [ ] **P6.2** 实现动态槽位询问界面
- [ ] **P6.3** 会话历史查看功能
- [ ] **P6.4** 任务进度展示
- [ ] **P6.5** 多轮对话支持

### Phase 7: 测试和文档 (1-2天)
- [ ] **P7.1** 编写新功能单元测试
- [ ] **P7.2** 编写集成测试
- [ ] **P7.3** 更新API文档
- [ ] **P7.4** 更新架构文档
- [ ] **P7.5** 编写用户使用指南

## 🔄 工作流程设计

### 新的AI Native流程
```
用户输入 → /api/next_action → Planner决策 → 执行Action
    │                              │              │
    ▼                              ▼              ▼
状态更新 ← ask_slot/plan_tasks ← 状态分析 → Writer/Verifier
    │                              │              │
    ▼                              ▼              ▼
前端展示 ← 任务结果 ← 内容生成 ← 知识注入 → 内容校验
```

### 状态槽位定义
```json
{
  "site_type": null,        // 网站类型
  "brand_name": null,       // 品牌名称
  "target_audience": null,  // 目标受众
  "content_goals": null,    // 内容目标
  "pages": [],             // 页面列表
  "current_page": null,    // 当前处理页面
  "knowledge_context": {}  // 知识上下文
}
```

## 🎯 成功标准

### 功能标准
- [ ] 支持多轮对话的动态内容生成
- [ ] 智能槽位询问和状态管理
- [ ] 知识驱动的个性化内容生成
- [ ] 完整的任务追踪和会话管理

### 技术标准
- [ ] 所有新功能有完整测试覆盖
- [ ] API响应时间<2秒
- [ ] 支持并发会话处理
- [ ] 向后兼容现有功能

### 质量标准
- [ ] 代码覆盖率保持>95%
- [ ] 所有测试通过
- [ ] 完整的文档更新
- [ ] 符合现有代码规范

## 📅 时间规划

**总预计时间：8-12天**

- **Week 1 (5天)**: Phase 1-3 (数据模型 + Prompt管理 + Planner升级)
- **Week 2 (4天)**: Phase 4-5 (多Agent协同 + API升级)  
- **Week 3 (3天)**: Phase 6-7 (前端升级 + 测试文档)

## 🚀 实施策略

### 敏捷原则
1. **增量开发**：每个Phase独立可测试
2. **持续集成**：每日提交和测试
3. **快速反馈**：及时调整设计和实现
4. **文档同步**：代码和文档同步更新

### 风险控制
1. **向后兼容**：保持现有API和功能不变
2. **渐进升级**：新旧系统并行运行
3. **回滚机制**：每个Phase都有回滚方案
4. **测试优先**：先写测试再写实现

## 📝 备注

- 本计划基于当前项目93%完成的知识库功能
- Verifier Agent为可选功能，可根据实际需求决定是否实现
- System Prompt存储在代码库中，便于版本控制和迭代
- 所有新功能都将保持与现有测试体系的兼容性
