# GeoCMS AI Native 升级计划

## 🎯 升级目标

将当前的GeoCMS PoC升级为"AI Native"的多Agent系统，实现：

1. **动态流程控制**：Planner Agent决定下一步行动，不再依赖前端固定流程
2. **多角色协同**：Planner → Writer → Verifier的完整闭环
3. **状态追踪管理**：基于`planner_runs.state`的会话状态管理
4. **知识驱动增强**：深度集成现有知识库，实现知识感知的智能生成

## 📊 当前项目状态

### ✅ 已完成功能

#### 后端
- 完整的知识库系统（数据层、业务层、API层）
- 基础AI代理架构（Planner + Writer）
- 知识感知内容生成
- 缺失知识检测和引导
- 98个测试，100%通过率

#### 前端（Next.js）
- Next.js 14 项目初始化（TypeScript + Tailwind CSS）
- 仪表板布局和导航
- 知识库管理页面（列表、搜索、删除）
- 内容策划页面（卡片展示）
- 草稿管理页面（列表预览）
- API Routes（知识库、策划、草稿、统计）
- Demo 数据（10+ 知识、5+ 策划、3+ 草稿）
- 响应式设计
- 基础文档（README、DEPLOYMENT、TESTING）

### 🔄 需要升级的部分

#### 后端
- 状态驱动的流程控制
- 多Agent协同机制
- System Prompt管理
- 会话状态追踪
- Verifier Agent（可选）

#### 前端（优先级 P0-P2）
详见下方"前端开发 Backlog"部分

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

### Phase 6: 前端界面升级 (2天) ✅
- [x] **P6.1** 重构前端支持状态驱动交互
- [x] **P6.2** 实现动态槽位询问界面
- [x] **P6.3** 会话历史查看功能
- [x] **P6.4** 任务进度展示
- [x] **P6.5** 多轮对话支持

### Phase 7: 测试和文档 (1-2天) ✅
- [x] **P7.1** 编写新功能单元测试
- [x] **P7.2** 编写集成测试
- [x] **P7.3** 更新API文档
- [x] **P7.4** 更新架构文档
- [x] **P7.5** 编写用户使用指南

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

## 📅 时间规划 ✅ 已完成

**总预计时间：8-12天** → **实际完成：6天**

- ✅ **Phase 1-5 (Day 1)**: 后台完整实现 (数据模型 + Prompt管理 + Planner升级 + 多Agent协同 + API升级)
- ✅ **Phase 6-7 (Day 2)**: 前端升级 + 测试文档 + 用户指南

## 🎉 项目完成状态

### ✅ 已完成功能
- **AI Native多Agent系统**: 完整的状态驱动对话系统
- **多轮对话界面**: 支持动态槽位询问和进度展示
- **Agent协同工作流**: Planner → Writer → Verifier完整流程
- **System Prompt管理**: 代码库中的提示词版本控制
- **完整测试覆盖**: 193个测试全部通过
- **向后兼容性**: 传统API继续正常工作
- **用户文档**: 完整的使用指南和API文档

### 📊 最终统计
- **代码文件**: 50+ 个新增/修改文件
- **测试覆盖**: 193个测试 (新增74个AI Native测试)
- **API端点**: 8个新的AI Native API端点
- **前端功能**: 完整的AI Native对话界面
- **文档更新**: 架构、API、用户指南全面更新

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

---

## 🎨 前端开发 Backlog

### Phase 1: UI 组件库完善（P0 - 必须完成）

#### 1.1 shadcn/ui 组件集成
- [x] 安装和配置 shadcn/ui 完整组件库
- [x] Button 组件（已有基础，需完善变体）
- [x] Input 组件（文本框、文本域）
- [x] Form 组件（表单容器和字段）
- [x] Dialog 组件（模态对话框）
- [x] Toast 组件（通知提示）
- [x] Alert Dialog 组件（警告提示）
- [ ] Badge 组件（标签徽章）
- [ ] Skeleton 组件（加载骨架屏）
- [ ] DropdownMenu 组件（下拉菜单）
- [ ] Select 组件（选择器）
- [ ] Tabs 组件（标签页）

#### 1.2 知识库管理完善
- [x] **添加知识对话框**
  - [x] 动态表单生成（基于知识类型）
  - [x] 表单验证（Zod schema）
  - [x] 提交处理和错误处理
  - [x] 成功提示（Toast）
- [x] **编辑知识对话框**
  - [x] 预填充现有数据
  - [x] 表单验证
  - [x] 更新处理
  - [x] 乐观更新（React Query）
- [x] **删除确认对话框**
  - [x] 二次确认
  - [x] 删除动画
  - [x] 成功/失败提示
- [x] **搜索增强**
  - [x] 实时搜索
  - [ ] 防抖处理
  - [ ] 搜索历史
  - [ ] 高级筛选（按类型、日期）
- [ ] **列表优化**
  - [ ] 虚拟滚动（大数据量）
  - [ ] 分页或无限滚动
  - [ ] 排序功能
  - [ ] 批量操作（多选、批量删除）

#### 1.3 内容策划完善
- [x] **创建策划对话框**
  - [x] 完整表单（标题、主题、分类）
  - [x] 大纲编辑器（引言、要点、结论）
  - [x] 关键词标签输入（动态添加/删除）
  - [x] 表单验证
  - [x] Toast 通知
  - [ ] 目标指标设置
  - [ ] 素材需求列表
- [ ] **编辑策划功能**
  - [ ] 完整的编辑表单
  - [ ] 状态流转（待素材 → 已确认）
  - [ ] 素材上传/链接
- [ ] **策划详情页**
  - [ ] 完整信息展示
  - [ ] 关联草稿显示
  - [ ] 操作历史
- [ ] **筛选和排序**
  - [ ] 按状态筛选
  - [ ] 按分类筛选
  - [ ] 按日期排序
  - [ ] 搜索功能

#### 1.4 草稿管理完善
- [ ] **Markdown 编辑器**
  - [ ] 集成 MDX Editor 或 Tiptap
  - [ ] 实时预览
  - [ ] 工具栏（格式化、插入）
  - [ ] 自动保存
  - [ ] 版本历史
- [ ] **草稿操作**
  - [ ] 编辑模式切换
  - [ ] 保存草稿
  - [ ] 提交审核
  - [ ] 审核反馈
  - [ ] 发布功能
- [ ] **预览增强**
  - [ ] Markdown 渲染优化
  - [ ] 代码高亮
  - [ ] 目录导航
  - [ ] 全屏预览
- [ ] **导出功能**
  - [ ] 导出为 Markdown
  - [ ] 导出为 HTML
  - [ ] 导出为 PDF（可选）
  - [ ] 复制到剪贴板

### Phase 2: 用户体验优化（P0 - 必须完成）

#### 2.1 加载状态
- [ ] 全局加载指示器
- [ ] 页面级骨架屏
- [x] 组件级加载状态（知识库、策划）
- [x] 按钮加载状态（提交时）
- [ ] 进度条（长时间操作）

#### 2.2 错误处理
- [ ] 全局错误边界
- [x] API 错误处理（Toast 提示）
- [x] 表单验证错误（Zod + React Hook Form）
- [x] 网络错误提示
- [ ] 404/500 错误页面

#### 2.3 空状态
- [x] 知识库空状态
- [x] 策划空状态
- [x] 草稿空状态
- [ ] 搜索无结果
- [ ] 引导性文案和操作

#### 2.4 反馈机制
- [x] Toast 通知系统（shadcn/ui）
- [x] 成功/失败提示
- [x] 操作确认（删除对话框）
- [ ] 进度反馈
- [ ] 帮助提示（Tooltip）

#### 2.5 动画和过渡
- [ ] 页面切换动画
- [ ] 列表项动画
- [x] 对话框动画（shadcn/ui 内置）
- [ ] 加载动画
- [ ] 微交互动画

### Phase 3: 高级功能（P1 - 应该完成）

#### 3.1 数据可视化
- [ ] 统计图表（Recharts）
- [ ] 知识库增长趋势
- [ ] 内容产出统计
- [ ] 状态分布饼图
- [ ] 关键词云图

#### 3.2 搜索和筛选
- [ ] 全局搜索
- [ ] 高级筛选面板
- [ ] 保存筛选条件
- [ ] 搜索建议
- [ ] 最近搜索

#### 3.3 批量操作
- [ ] 多选功能
- [ ] 批量删除
- [ ] 批量导出
- [ ] 批量状态更新
- [ ] 操作撤销

#### 3.4 个性化设置
- [ ] 主题切换（亮色/暗色）
- [ ] 布局偏好（列表/卡片）
- [ ] 语言切换
- [ ] 快捷键设置
- [ ] 用户偏好保存

### Phase 4: 性能优化（P1 - 应该完成）

#### 4.1 代码优化
- [ ] 代码分割优化
- [ ] 懒加载组件
- [ ] 图片优化（Next.js Image）
- [ ] 字体优化
- [ ] Bundle 分析和优化

#### 4.2 数据优化
- [ ] React Query 缓存策略
- [ ] 乐观更新
- [ ] 预加载数据
- [ ] 虚拟滚动
- [ ] 分页优化

#### 4.3 渲染优化
- [ ] React.memo 优化
- [ ] useMemo/useCallback
- [ ] 避免不必要的重渲染
- [ ] 服务端渲染优化
- [ ] 静态生成优化

### Phase 5: 测试和质量保证（P0 - 必须完成）

#### 5.1 单元测试
- [ ] 组件测试（Jest + RTL）
- [ ] Hooks 测试
- [ ] 工具函数测试
- [ ] API 测试
- [ ] 覆盖率 > 80%

#### 5.2 集成测试
- [ ] 页面流程测试
- [ ] API 集成测试
- [ ] 表单提交测试
- [ ] 错误场景测试

#### 5.3 E2E 测试
- [ ] Playwright 配置
- [ ] 关键流程测试
- [ ] 跨浏览器测试
- [ ] 移动端测试

#### 5.4 性能测试
- [ ] Lighthouse 测试
- [ ] Core Web Vitals
- [ ] 加载性能
- [ ] 运行时性能

### Phase 6: 文档和部署（P1 - 应该完成）

#### 6.1 文档完善
- [ ] 组件文档（Storybook）
- [ ] API 文档
- [ ] 开发指南
- [ ] 贡献指南
- [ ] 变更日志

#### 6.2 部署优化
- [ ] Vercel 配置优化
- [ ] 环境变量管理
- [ ] CI/CD 流程
- [ ] 预览部署
- [ ] 生产部署

#### 6.3 监控和分析
- [ ] 错误监控（Sentry）
- [ ] 性能监控
- [ ] 用户分析
- [ ] A/B 测试
- [ ] 反馈收集

---

## 📋 当前迭代任务（Sprint 1）

### 目标：完成生产级核心功能

#### 本次迭代重点（2-3 天）
1. **shadcn/ui 组件集成** ✅
2. **知识库 CRUD 完整实现** ✅
3. **内容策划创建功能** ✅
4. **Toast 通知系统** ✅
5. **加载和错误状态** ✅
6. **表单验证** ✅
7. **确认对话框** ✅

#### 已完成功能
- ✅ shadcn/ui 核心组件（Button, Input, Textarea, Form, Dialog, Toast, Alert Dialog）
- ✅ 知识库添加对话框（JSON 格式，表单验证）
- ✅ 知识库编辑对话框（预填充数据，更新处理）
- ✅ 知识库删除确认对话框（二次确认）
- ✅ 内容策划创建对话框（完整表单，动态字段管理）
- ✅ Toast 通知系统（成功/失败提示）
- ✅ 表单验证（Zod schema）
- ✅ 加载状态（按钮、页面）
- ✅ 错误处理（API 错误、表单错误）

#### 验收标准
- [x] 所有表单功能完整可用
- [x] 用户操作有明确反馈
- [x] 错误处理完善
- [x] 加载状态清晰
- [x] 无控制台错误
- [x] 移动端体验良好
- [x] 代码质量高（ESLint 通过）
- [x] 构建成功

### 下一步迭代（Sprint 2）

#### 优先级 P0（必须完成）
1. **草稿 Markdown 编辑器**
   - 集成 Tiptap 或 MDX Editor
   - 实时预览
   - 自动保存

2. **策划编辑功能**
   - 编辑对话框
   - 状态更新

3. **骨架屏和加载优化**
   - 页面级骨架屏
   - 更好的加载体验

#### 优先级 P1（应该完成）
4. **搜索优化**
   - 防抖处理
   - 高级筛选

5. **批量操作**
   - 多选功能
   - 批量删除

---

## 📝 备注

- 本计划基于当前项目93%完成的知识库功能
- Verifier Agent为可选功能，可根据实际需求决定是否实现
- System Prompt存储在代码库中，便于版本控制和迭代
- 所有新功能都将保持与现有测试体系的兼容性
- **前端开发遵循"生产级、行业最佳"标准，不做简化处理**
