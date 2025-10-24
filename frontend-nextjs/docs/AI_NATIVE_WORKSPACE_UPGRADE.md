# GeoCMS AI Native Workspace 体验升级方案

> **版本**: v1.0  
> **日期**: 2025-10-24  
> **目标**: 将 GeoCMS 前端工作台升级为 AI 时代的任务驱动、人机协作的智能工作空间

---

## 📋 目录

1. [设计理念](#设计理念)
2. [核心改进方向](#核心改进方向)
3. [详细设计方案](#详细设计方案)
4. [技术实施建议](#技术实施建议)
5. [组件设计规范](#组件设计规范)
6. [实施路线图](#实施路线图)
7. [参考资料](#参考资料)

---

## 🎯 设计理念

### 核心原则

**从"功能导航"到"任务参与"的范式转变**

传统 CMS 工作台以功能模块为中心，用户需要：
1. 记住功能在哪个模块
2. 导航到对应页面
3. 查找需要处理的内容
4. 执行操作

AI Native 工作台以任务和人为中心，用户应该：
1. **立即看到**需要做什么（任务优先）
2. **快速参与**正在进行的工作（一键操作）
3. **了解进展**团队和 AI 的工作状态（可视化）
4. **随时求助**当不确定时询问 AI（智能助手）

### 设计目标

| 目标 | 当前状态 | 期望状态 |
|------|---------|---------|
| **首要信息** | 统计数据 | 我的待办任务 |
| **导航方式** | 14个模块链接 | 任务卡片 + 弱化导航 |
| **参与方式** | 多次点击跳转 | 浮窗快速操作 |
| **AI 交互** | 被动展示 | 主动协助 + 聊天入口 |
| **进展感知** | 静态统计 | 动态时间线 + 人员状态 |

---

## 🚀 核心改进方向

### 1. 任务优先的首页重构

**设计原则**: "用户打开系统，第一眼看到的应该是'我现在要做什么'"

#### 当前问题
- 首页顶部是统计卡片（Knowledge Base: 10, Planning: 5...）
- 用户需要向下滚动才能看到 Active Tasks
- 统计数据对日常工作参与价值有限

#### 改进方案
```
首页布局（从上到下）：

┌─────────────────────────────────────────────────┐
│ 1. 我的待办任务区 (My Action Items)              │
│    - 待审批内容 (2)                              │
│    - 待反馈计划 (1)                              │
│    - 延迟任务提醒 (1)                            │
│    [一键操作按钮]                                │
├─────────────────────────────────────────────────┤
│ 2. 团队工作进展 (Team Progress)                  │
│    - Agent 状态栏（谁在做什么）                  │
│    - 活跃任务数 / 完成数 / 失败数                │
│    - 进度可视化                                  │
├─────────────────────────────────────────────────┤
│ 3. 最近活动 (Recent Activity)                    │
│    - 时间线视图                                  │
│    - 可点击进入详情                              │
├─────────────────────────────────────────────────┤
│ 4. 快速启动 (Quick Start)                        │
│    - 创建内容计划                                │
│    - 上传知识                                    │
│    - 查看全部任务                                │
├─────────────────────────────────────────────────┤
│ 5. 统计概览 (Stats Overview - 可折叠)            │
│    - 知识库 / 计划 / 草稿 / 已发布               │
└─────────────────────────────────────────────────┘
```

#### 关键特性
- **角色定制**: 不同角色看到不同的待办任务
  - 内容策划者：待创建的计划
  - 审核者：待审批的草稿
  - 管理者：延迟任务和团队状态
- **优先级排序**: 按截止时间、重要性、用户角色自动排序
- **可操作性**: 每个任务卡片直接提供操作按钮
- **空状态处理**: 无任务时显示引导和建议

### 2. 浮动交互面板 (Floating Action Panel)

**设计原则**: "用户在任何页面都能快速访问待办事项，无需跳转"

#### 组件设计

**位置**: 右下角固定浮动按钮 + 可展开抽屉

**收起状态**:
```
┌──────────┐
│  📋 3    │  ← 徽章显示待办数量
└──────────┘
```

**展开状态** (占屏幕高度 1/3 - 1/2):
```
┌─────────────────────────────────────┐
│ 我的待办 (My Inbox)          [×]    │
├─────────────────────────────────────┤
│ 🔴 紧急 (2)                         │
│ ├─ 草稿审批: "旅游攻略..."          │
│ │  [批准] [拒绝] [查看详情]          │
│ └─ 计划反馈: "Q1内容规划"           │
│    [添加反馈] [查看]                │
├─────────────────────────────────────┤
│ 🟡 今日 (1)                         │
│ └─ 知识更新: "品牌指南过期"         │
│    [更新] [忽略]                    │
├─────────────────────────────────────┤
│ 💡 AI 建议 (3)                      │
│ └─ 建议添加 SEO 关键词到草稿 #123   │
│    [应用] [忽略]                    │
└─────────────────────────────────────┘
```

#### 功能特性
- **智能过滤**: 只显示高优先级和相关任务
- **快速操作**: 一键批准、拒绝、标记完成
- **AI 建议**: 展示 AI 主动发现的优化建议
- **通知管理**: 用户可配置提醒规则
- **跨页面持久**: 在任何页面都可访问

#### 技术实现
- 使用 `shadcn/ui` 的 `Sheet` 组件（从右侧滑出）
- 使用 `Badge` 显示未读数量
- 使用 `Popover` 实现快速预览
- 使用 React Query 实时同步数据
- 使用 Zustand 管理展开/收起状态

### 3. AI 智能助手入口 (AI Assistant)

**设计原则**: "当用户不知道下一步做什么时，AI 助手随时待命"

#### 组件设计

**位置**: 右下角（浮动面板上方）

**收起状态**:
```
┌──────────┐
│  🤖 AI   │
└──────────┘
```

**展开状态** (聊天界面):
```
┌─────────────────────────────────────┐
│ AI 助手                      [×]    │
├─────────────────────────────────────┤
│ 💬 你好！我能帮你什么？              │
│                                     │
│ 快捷问题:                           │
│ • 我现在有什么任务？                │
│ • 我该先做哪个？                    │
│ • 帮我创建一个内容计划              │
│ • 这个草稿有什么问题？              │
├─────────────────────────────────────┤
│ [输入你的问题...]          [发送]   │
└─────────────────────────────────────┘
```

#### 功能特性
- **上下文感知**: 知道用户当前在哪个页面，提供相关建议
- **任务查询**: "我有什么任务？" → 列出待办
- **优先级建议**: "我该先做哪个？" → AI 推荐
- **内容创作**: "帮我写一个关于...的大纲" → 调用 AI Native API
- **问题诊断**: "这个草稿为什么失败？" → 分析并给出建议
- **快捷操作**: 聊天中可直接触发操作（如"批准草稿 #123"）

#### 技术实现
- 使用 `Sheet` 或 `Dialog` 组件
- 集成现有的 AI Native Chat API
- 使用流式响应提升体验
- 支持快捷命令（如 `/tasks`, `/create`）
- 保存聊天历史（可选）

### 4. 导航优化 - 从模块到任务流

**设计原则**: "减少导航复杂度，让用户通过任务流自然到达目标"

#### 当前问题
- 左侧导航有 14 个模块链接
- 用户需要记住功能在哪个模块
- 导航占据大量屏幕空间

#### 改进方案

**简化导航结构**:
```
当前 (14 项):                    优化后 (6-8 项):
├─ Overview                     ├─ 🏠 工作台 (Dashboard)
├─ AI Team                      ├─ ✅ 我的任务 (My Tasks)
├─ Activity                     ├─ 👥 团队 (Team)
├─ Tasks                        ├─ 📚 内容库 (Content)
├─ Knowledge                    │   ├─ 知识
├─ Planning                     │   ├─ 计划
├─ Drafts                       │   ├─ 草稿
├─ Media                        │   └─ 媒体
├─ Publishing                   ├─ 📊 洞察 (Insights)
├─ Templates                    ├─ ⚙️ 设置 (Settings)
├─ Categories                   └─ 💬 AI 助手 (固定底部)
├─ Tags
├─ Calendar
└─ Settings
```

**导航行为**:
- **默认收起**: 只显示图标，鼠标悬停展开
- **智能高亮**: 根据当前任务高亮相关模块
- **面包屑**: 顶部显示当前位置
- **快捷键**: 支持键盘快捷键（如 `G + D` 跳转到 Dashboard）

#### 任务流导航
用户主要通过任务卡片导航，而非模块链接：
- 点击"待审批草稿" → 直接进入草稿详情页
- 点击"Agent 正在写作" → 进入任务监控页
- 点击"知识过期提醒" → 进入知识编辑页

### 5. 人员和进展可视化

**设计原则**: "让用户随时了解'谁在做什么'和'进展如何'"

#### Agent 状态栏增强

**当前**: 简单的头像 + 状态点

**优化后**:
```
┌────────────────────────────────────────────────────┐
│ AI 团队状态                                         │
├────────────────────────────────────────────────────┤
│ [Alex 头像] 知识管理员                              │
│ 🟢 活跃 | 正在处理: 品牌指南更新                    │
│ 进度: ████████░░ 80%                               │
├────────────────────────────────────────────────────┤
│ [Sarah 头像] 内容策划                               │
│ 🟡 空闲 | 上次任务: 2分钟前                         │
│ 今日完成: 3 个计划                                  │
├────────────────────────────────────────────────────┤
│ [Emma 头像] 内容撰写                                │
│ 🟢 活跃 | 正在写作: "春季旅游攻略"                  │
│ 进度: ███░░░░░░░ 30%                               │
└────────────────────────────────────────────────────┘
```

#### 任务流程可视化

**Swimlane 视图** (用于复杂任务):
```
计划 → 撰写 → 审核 → 发布
  ↓      ↓      ↓      ↓
Sarah  Emma  Michael  系统
 🟢     🟢     ⏸️      ⏳
```

#### 进度时间线

**增强的活动时间线**:
- 显示每个步骤的耗时
- 标注延迟的环节
- 可点击查看详情
- 支持筛选（按 Agent、按任务类型）

---

## 🛠️ 技术实施建议

### 技术栈选择

| 功能 | 推荐技术 | 理由 |
|------|---------|------|
| **浮动面板** | `shadcn/ui Sheet` | 已集成，支持从各方向滑出 |
| **通知徽章** | `shadcn/ui Badge` | 已集成，样式统一 |
| **AI 聊天** | `shadcn/ui Dialog` + 自定义 | 灵活，可复用现有 API |
| **动画效果** | `framer-motion` | 行业标准，性能好 |
| **状态管理** | `Zustand` (已有) | 轻量，适合 UI 状态 |
| **数据同步** | `React Query` (已有) | 自动缓存和刷新 |
| **实时更新** | `WebSocket` 或轮询 | 根据后端能力选择 |

### 新增依赖

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",  // 动画
    "date-fns": "^3.0.0",        // 日期处理（已有）
    "react-hot-toast": "^2.4.1"  // 轻量级通知（可选）
  }
}
```

### 组件架构

```
src/components/
├── workspace/                    # 新增：工作台组件
│   ├── ActionItemsPanel.tsx     # 我的待办面板
│   ├── FloatingInbox.tsx        # 浮动收件箱
│   ├── AIAssistant.tsx          # AI 助手
│   ├── TaskCard.tsx             # 任务卡片
│   └── PriorityBadge.tsx        # 优先级徽章
├── team/                         # 增强：团队组件
│   ├── AgentStatusBar.tsx       # 增强 Agent 状态栏
│   ├── AgentProgressCard.tsx    # Agent 进度卡片
│   ├── TaskFlowVisualization.tsx # 任务流程可视化
│   └── ActivityTimeline.tsx     # 增强活动时间线
├── navigation/                   # 新增：导航组件
│   ├── CollapsibleSidebar.tsx   # 可收起侧边栏
│   ├── Breadcrumb.tsx           # 面包屑
│   └── QuickActions.tsx         # 快捷操作
└── ui/                           # 现有 UI 组件
    └── ...
```

---

## 📐 组件设计规范

### 1. FloatingInbox 组件

**Props**:
```typescript
interface FloatingInboxProps {
  position?: 'bottom-right' | 'bottom-left'  // 位置
  defaultOpen?: boolean                       // 默认展开
  maxHeight?: string                          // 最大高度
  onActionComplete?: (actionId: string) => void
}
```

**状态管理**:
```typescript
const useInboxStore = create((set) => ({
  isOpen: false,
  unreadCount: 0,
  items: [],
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  markAsRead: (id) => { /* ... */ },
}))
```

**数据结构**:
```typescript
interface InboxItem {
  id: string
  type: 'approval' | 'feedback' | 'suggestion' | 'alert'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  title: string
  description?: string
  actions: InboxAction[]
  createdAt: Date
  dueDate?: Date
  relatedEntity: {
    type: 'draft' | 'plan' | 'knowledge'
    id: string
  }
}

interface InboxAction {
  id: string
  label: string
  variant: 'default' | 'destructive' | 'outline'
  onClick: () => Promise<void>
}
```

### 2. AIAssistant 组件

**Props**:
```typescript
interface AIAssistantProps {
  position?: 'bottom-right' | 'bottom-left'
  contextAware?: boolean  // 是否感知当前页面上下文
  quickCommands?: QuickCommand[]
}

interface QuickCommand {
  label: string
  command: string
  icon?: React.ReactNode
}
```

**集成现有 API**:
```typescript
// 复用 AI Native Chat API
const sendMessage = async (message: string, context?: PageContext) => {
  const response = await fetch('/api/ai-native/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      context: {
        page: context?.page,
        entity_id: context?.entityId,
        entity_type: context?.entityType,
      }
    })
  })
  return response.json()
}
```

### 3. TaskCard 组件

**设计**:
```typescript
interface TaskCardProps {
  task: InboxItem
  variant?: 'compact' | 'detailed'
  showActions?: boolean
  onActionClick?: (actionId: string) => void
}
```

**视觉层次**:
- 优先级颜色编码（红/黄/蓝/灰）
- 截止时间倒计时
- Agent 头像（如果是 AI 任务）
- 一键操作按钮

### 4. CollapsibleSidebar 组件

**功能**:
- 默认收起，只显示图标
- 鼠标悬停展开
- 支持固定展开（用户偏好）
- 响应式：移动端自动隐藏

**实现**:
```typescript
const [isCollapsed, setIsCollapsed] = useState(true)
const [isPinned, setIsPinned] = useState(false)

// 使用 framer-motion 实现平滑动画
<motion.div
  initial={{ width: 64 }}
  animate={{ width: isCollapsed && !isPinned ? 64 : 256 }}
  transition={{ duration: 0.2 }}
>
  {/* 导航内容 */}
</motion.div>
```

---

## 🗺️ 实施路线图

### Phase 1: 基础架构 (1-2 周)

**目标**: 建立新组件基础，不影响现有功能

- [ ] 安装新依赖 (`framer-motion`)
- [ ] 创建 `workspace/` 组件目录
- [ ] 实现 `FloatingInbox` 基础组件（无数据）
- [ ] 实现 `AIAssistant` 基础组件（无 AI 集成）
- [ ] 实现 `CollapsibleSidebar` 组件
- [ ] 添加全局状态管理（Zustand stores）

**验收标准**:
- 浮动面板可以展开/收起
- AI 助手界面可以显示
- 侧边栏可以收起/展开
- 无功能性 bug

### Phase 2: 数据集成 (1-2 周)

**目标**: 连接后端 API，展示真实数据

- [ ] 设计 Inbox API 接口
  ```typescript
  GET /api/inbox/items?priority=urgent&limit=10
  POST /api/inbox/items/:id/actions/:actionId
  ```
- [ ] 实现任务数据获取和缓存
- [ ] 集成 AI Native Chat API 到助手
- [ ] 实现实时数据更新（轮询或 WebSocket）
- [ ] 添加乐观更新（Optimistic UI）

**验收标准**:
- 浮动面板显示真实待办任务
- AI 助手可以回答问题
- 数据自动刷新
- 操作后立即反馈

### Phase 3: 首页重构 (1 周)

**目标**: 重新设计 Dashboard 页面布局

- [ ] 创建 `ActionItemsPanel` 组件
- [ ] 增强 `TeamStatusBar` 显示更多信息
- [ ] 重新排列首页布局（任务优先）
- [ ] 实现角色定制逻辑
- [ ] 添加空状态和引导

**验收标准**:
- 首页第一屏显示待办任务
- 不同角色看到不同内容
- 无任务时有明确引导
- 所有链接可点击跳转

### Phase 4: 导航优化 (1 周)

**目标**: 简化导航，提升可用性

- [ ] 合并导航项（14 → 6-8）
- [ ] 实现导航收起/展开动画
- [ ] 添加面包屑导航
- [ ] 实现键盘快捷键
- [ ] 优化移动端导航

**验收标准**:
- 导航更简洁
- 动画流畅
- 快捷键可用
- 移动端体验良好

### Phase 5: 可视化增强 (1 周)

**目标**: 提升进展感知

- [ ] 增强 Agent 状态卡片
- [ ] 实现任务流程可视化
- [ ] 增强活动时间线
- [ ] 添加进度动画
- [ ] 实现数据图表（可选）

**验收标准**:
- Agent 状态信息丰富
- 任务流程清晰可见
- 时间线易于理解
- 动画提升体验

### Phase 6: 优化和测试 (1 周)

**目标**: 性能优化和全面测试

- [ ] 性能优化（懒加载、代码分割）
- [ ] 无障碍性测试（ARIA 标签）
- [ ] 跨浏览器测试
- [ ] 移动端测试
- [ ] 用户测试和反馈收集

**验收标准**:
- Lighthouse 分数 > 90
- 无障碍性达标
- 主流浏览器兼容
- 用户反馈积极

---

## 📚 参考资料

### 设计参考

1. **Linear** - 任务优先的工作台设计
   - 快捷键驱动
   - 命令面板
   - 实时协作

2. **Notion** - 灵活的内容组织
   - 侧边栏设计
   - 快速操作
   - AI 助手集成

3. **Asana** - 任务管理最佳实践
   - 我的任务视图
   - 优先级管理
   - 团队协作

4. **GitHub** - 通知和收件箱
   - 通知中心设计
   - 过滤和分组
   - 快速操作

### 技术文档

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/best-practices)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

### UX 研究

- [Dashboard Design Best Practices](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Task-Centric UI Design](https://www.nngroup.com/articles/task-analysis/)
- [AI Interface Design Patterns](https://www.nngroup.com/articles/ai-paradigm/)

---

## 🎨 设计资产

### 颜色系统

```css
/* 优先级颜色 */
--priority-urgent: #EF4444;    /* 红色 */
--priority-high: #F59E0B;      /* 橙色 */
--priority-normal: #3B82F6;    /* 蓝色 */
--priority-low: #6B7280;       /* 灰色 */

/* Agent 状态颜色 */
--agent-active: #10B981;       /* 绿色 */
--agent-idle: #F59E0B;         /* 黄色 */
--agent-offline: #6B7280;      /* 灰色 */
```

### 动画时长

```css
/* 遵循 Material Design 动画规范 */
--duration-instant: 100ms;     /* 即时反馈 */
--duration-fast: 200ms;        /* 快速过渡 */
--duration-normal: 300ms;      /* 标准动画 */
--duration-slow: 500ms;        /* 复杂动画 */
```

---

## ✅ 成功指标

### 用户体验指标

- **任务发现时间**: 从登录到找到待办任务 < 3 秒
- **操作完成时间**: 完成一个审批操作 < 10 秒
- **导航效率**: 到达目标页面的平均点击数 < 2 次
- **AI 助手使用率**: 每日活跃用户中 > 30% 使用 AI 助手

### 技术指标

- **首屏加载时间**: < 1.5 秒
- **交互响应时间**: < 100ms
- **Lighthouse 性能分数**: > 90
- **无障碍性分数**: > 95

### 业务指标

- **任务完成率**: 提升 20%
- **用户满意度**: NPS > 50
- **功能使用率**: 核心功能使用率 > 70%

---

## 📝 附录

### A. 用户角色定义

| 角色 | 主要任务 | 首页优先显示 |
|------|---------|-------------|
| **内容策划** | 创建内容计划 | 待创建的计划、知识缺失提醒 |
| **内容审核** | 审批草稿 | 待审批草稿、质量问题 |
| **知识管理** | 维护知识库 | 过期知识、缺失知识 |
| **管理者** | 监控进展 | 延迟任务、团队状态、关键指标 |

### B. 快捷键映射

| 快捷键 | 功能 |
|--------|------|
| `G + D` | 跳转到 Dashboard |
| `G + T` | 跳转到 My Tasks |
| `G + K` | 打开命令面板 |
| `Ctrl/Cmd + K` | 打开搜索 |
| `Ctrl/Cmd + /` | 打开 AI 助手 |
| `I` | 打开/关闭 Inbox |
| `?` | 显示快捷键帮助 |

### C. 响应式断点

```typescript
const breakpoints = {
  mobile: '640px',    // 手机
  tablet: '768px',    // 平板
  laptop: '1024px',   // 笔记本
  desktop: '1280px',  // 桌面
}
```

---

## 🔌 API 设计建议

### Inbox API

#### 获取待办事项
```typescript
GET /api/workspace/inbox

Query Parameters:
- priority?: 'urgent' | 'high' | 'normal' | 'low'
- type?: 'approval' | 'feedback' | 'suggestion' | 'alert'
- limit?: number (default: 20)
- offset?: number

Response:
{
  items: InboxItem[],
  total: number,
  unread_count: number,
  stats: {
    urgent: number,
    high: number,
    normal: number,
    low: number
  }
}
```

#### 执行操作
```typescript
POST /api/workspace/inbox/:id/actions/:actionId

Request Body:
{
  comment?: string,
  metadata?: Record<string, any>
}

Response:
{
  success: boolean,
  message: string,
  updated_item?: InboxItem
}
```

#### 标记已读
```typescript
PATCH /api/workspace/inbox/:id/read

Response:
{
  success: boolean,
  unread_count: number
}
```

### AI Assistant API

#### 发送消息（复用现有 AI Native API）
```typescript
POST /api/ai-native/chat

Request Body:
{
  message: string,
  conversation_id?: string,
  context?: {
    page: string,           // 当前页面
    entity_type?: string,   // 实体类型
    entity_id?: string,     // 实体 ID
    user_role?: string      // 用户角色
  }
}

Response (Stream):
{
  type: 'message' | 'action' | 'suggestion',
  content: string,
  actions?: QuickAction[],
  metadata?: Record<string, any>
}
```

#### 快捷命令
```typescript
POST /api/workspace/commands

Request Body:
{
  command: string,  // e.g., "/tasks", "/create plan"
  args?: string[]
}

Response:
{
  type: 'redirect' | 'data' | 'action',
  payload: any
}
```

### Dashboard API

#### 获取个性化仪表板
```typescript
GET /api/workspace/dashboard

Query Parameters:
- role?: string  // 用户角色

Response:
{
  action_items: ActionItem[],
  team_status: TeamStatus,
  recent_activity: Activity[],
  quick_stats: Stats,
  recommendations: Recommendation[]
}
```

---

## 🔄 数据流设计

### 实时更新策略

#### 方案 1: 轮询（推荐用于 MVP）
```typescript
// 使用 React Query 的 refetchInterval
const { data } = useQuery({
  queryKey: ['inbox'],
  queryFn: fetchInbox,
  refetchInterval: 5000,  // 每 5 秒刷新
  refetchIntervalInBackground: false,  // 后台不刷新
})
```

#### 方案 2: WebSocket（推荐用于生产环境）
```typescript
// 建立 WebSocket 连接
const ws = new WebSocket('ws://api/workspace/updates')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)

  switch (update.type) {
    case 'inbox_new':
      queryClient.invalidateQueries(['inbox'])
      showNotification(update.data)
      break
    case 'task_completed':
      queryClient.invalidateQueries(['tasks'])
      break
    case 'agent_status_changed':
      queryClient.setQueryData(['team-status'], update.data)
      break
  }
}
```

### 乐观更新

```typescript
// 示例：批准草稿
const approveDraft = useMutation({
  mutationFn: (draftId: string) =>
    api.post(`/inbox/${draftId}/actions/approve`),

  onMutate: async (draftId) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries(['inbox'])

    // 保存当前数据
    const previousInbox = queryClient.getQueryData(['inbox'])

    // 乐观更新
    queryClient.setQueryData(['inbox'], (old: any) => ({
      ...old,
      items: old.items.filter((item: any) => item.id !== draftId),
      unread_count: old.unread_count - 1
    }))

    return { previousInbox }
  },

  onError: (err, draftId, context) => {
    // 回滚
    queryClient.setQueryData(['inbox'], context?.previousInbox)
    toast.error('操作失败，请重试')
  },

  onSuccess: () => {
    toast.success('草稿已批准')
  }
})
```

---

## 🎭 交互流程设计

### 用户故事 1: 审批草稿

```
1. 用户登录 → 首页显示 "待审批草稿 (2)"
2. 用户点击任务卡片 → 展开草稿预览
3. 用户点击 [批准] 按钮
   ├─ 立即显示加载状态
   ├─ 乐观更新 UI（移除该项）
   ├─ 发送 API 请求
   └─ 显示成功提示
4. 如果失败 → 回滚 UI + 显示错误信息
```

**组件交互**:
```typescript
<TaskCard task={draftApprovalTask}>
  <TaskPreview draft={draft} />
  <TaskActions>
    <Button
      onClick={() => approveDraft.mutate(draft.id)}
      loading={approveDraft.isLoading}
    >
      批准
    </Button>
    <Button variant="outline" onClick={openDetailView}>
      查看详情
    </Button>
  </TaskActions>
</TaskCard>
```

### 用户故事 2: 使用 AI 助手

```
1. 用户不确定下一步 → 点击右下角 AI 助手图标
2. 助手展开 → 显示快捷问题
3. 用户点击 "我现在有什么任务？"
   ├─ 发送请求到 AI API
   ├─ 流式显示回复
   └─ 显示任务列表 + 快捷操作按钮
4. 用户点击 "批准草稿 #123"
   ├─ 直接调用批准 API
   ├─ 更新 Inbox
   └─ 在聊天中显示确认消息
```

**组件交互**:
```typescript
<AIAssistant>
  <ChatMessages messages={messages} />
  <QuickCommands>
    <Command onClick={() => sendMessage("我现在有什么任务？")}>
      我现在有什么任务？
    </Command>
  </QuickCommands>
  <ChatInput onSend={sendMessage} />
</AIAssistant>
```

### 用户故事 3: 浮动 Inbox 快速操作

```
1. 用户在任意页面工作
2. 右下角显示徽章 "3" → 有 3 个待办
3. 用户点击徽章 → Inbox 从右侧滑出
4. 显示分组的待办事项：
   ├─ 🔴 紧急 (1)
   ├─ 🟡 今日 (1)
   └─ 💡 AI 建议 (1)
5. 用户点击 [批准] → 立即执行 + 更新徽章
6. 用户点击 [查看详情] → 跳转到详情页 + Inbox 自动收起
```

---

## 🚨 错误处理和边界情况

### 网络错误

```typescript
// 全局错误处理
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        if (error.message.includes('Network')) {
          toast.error('网络连接失败，请检查网络')
        }
      }
    }
  }
})
```

### 空状态处理

#### Inbox 无待办
```tsx
{items.length === 0 && (
  <EmptyState
    icon={<CheckCircle className="h-12 w-12 text-green-500" />}
    title="太棒了！"
    description="你已完成所有待办事项"
    action={
      <Button onClick={goToDashboard}>
        返回工作台
      </Button>
    }
  />
)}
```

#### Dashboard 无任务
```tsx
{actionItems.length === 0 && (
  <EmptyState
    icon={<Sparkles className="h-12 w-12 text-blue-500" />}
    title="准备好开始了吗？"
    description="创建你的第一个内容计划"
    action={
      <Button onClick={openCreatePlanDialog}>
        创建内容计划
      </Button>
    }
  />
)}
```

### 权限错误

```typescript
// 操作前检查权限
const canApprove = user.role === 'editor' || user.role === 'admin'

{canApprove ? (
  <Button onClick={approve}>批准</Button>
) : (
  <Tooltip content="你没有批准权限">
    <Button disabled>批准</Button>
  </Tooltip>
)}
```

### 并发冲突

```typescript
// 处理乐观更新冲突
onError: (error, variables, context) => {
  if (error.status === 409) {
    // 数据已被其他用户修改
    toast.error('该任务已被其他用户处理')
    queryClient.invalidateQueries(['inbox'])
  } else {
    // 回滚到之前的状态
    queryClient.setQueryData(['inbox'], context?.previousInbox)
  }
}
```

---

## 🌍 国际化考虑

### 文本国际化

```typescript
// 使用 i18n
import { useTranslation } from 'next-i18next'

const { t } = useTranslation('workspace')

<h2>{t('inbox.title')}</h2>
<p>{t('inbox.empty_state.description')}</p>
```

### 日期和时间

```typescript
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

const locale = user.language === 'zh' ? zhCN : enUS

formatDistanceToNow(task.createdAt, {
  addSuffix: true,
  locale
})
// 中文: "2分钟前"
// 英文: "2 minutes ago"
```

### 优先级和状态

```typescript
// 翻译文件 zh.json
{
  "priority": {
    "urgent": "紧急",
    "high": "高",
    "normal": "普通",
    "low": "低"
  },
  "agent_status": {
    "active": "活跃",
    "idle": "空闲",
    "offline": "离线"
  }
}
```

---

## 🧪 测试策略

### 单元测试

```typescript
// FloatingInbox.test.tsx
describe('FloatingInbox', () => {
  it('should show unread count badge', () => {
    render(<FloatingInbox unreadCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should toggle open/close on click', async () => {
    render(<FloatingInbox />)
    const button = screen.getByRole('button')

    await userEvent.click(button)
    expect(screen.getByText('我的待办')).toBeInTheDocument()

    await userEvent.click(button)
    expect(screen.queryByText('我的待办')).not.toBeInTheDocument()
  })
})
```

### 集成测试

```typescript
// Dashboard.integration.test.tsx
describe('Dashboard Integration', () => {
  it('should load and display action items', async () => {
    // Mock API
    server.use(
      rest.get('/api/workspace/inbox', (req, res, ctx) => {
        return res(ctx.json({
          items: [mockUrgentTask, mockNormalTask],
          unread_count: 2
        }))
      })
    )

    render(<Dashboard />)

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('待审批草稿')).toBeInTheDocument()
    })

    // 验证任务显示
    expect(screen.getByText(mockUrgentTask.title)).toBeInTheDocument()
  })
})
```

### E2E 测试

```typescript
// e2e/inbox-workflow.spec.ts
test('complete approval workflow', async ({ page }) => {
  await page.goto('/dashboard')

  // 点击浮动 Inbox
  await page.click('[data-testid="floating-inbox-button"]')

  // 验证 Inbox 打开
  await expect(page.locator('[data-testid="inbox-panel"]')).toBeVisible()

  // 点击批准按钮
  await page.click('[data-testid="approve-button-123"]')

  // 验证成功提示
  await expect(page.locator('text=草稿已批准')).toBeVisible()

  // 验证任务从列表中移除
  await expect(page.locator('[data-testid="task-123"]')).not.toBeVisible()
})
```

---

## 📊 性能优化

### 代码分割

```typescript
// 懒加载大型组件
const AIAssistant = lazy(() => import('@/components/workspace/AIAssistant'))
const FloatingInbox = lazy(() => import('@/components/workspace/FloatingInbox'))

// 使用 Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AIAssistant />
</Suspense>
```

### 虚拟滚动

```typescript
// 对于长列表使用虚拟滚动
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
})

{rowVirtualizer.getVirtualItems().map((virtualRow) => (
  <TaskCard key={virtualRow.index} task={items[virtualRow.index]} />
))}
```

### 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src={agent.avatar}
  alt={agent.name}
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
/>
```

### 缓存策略

```typescript
// 设置合理的缓存时间
const { data } = useQuery({
  queryKey: ['inbox'],
  queryFn: fetchInbox,
  staleTime: 30000,      // 30秒内认为数据新鲜
  cacheTime: 300000,     // 5分钟后清除缓存
})
```

---

## 🔐 安全考虑

### XSS 防护

```typescript
// 对用户输入进行转义
import DOMPurify from 'dompurify'

const sanitizedContent = DOMPurify.sanitize(userInput)
```

### CSRF 防护

```typescript
// 在所有修改操作中包含 CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content

fetch('/api/inbox/123/approve', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken
  }
})
```

### 权限验证

```typescript
// 前端验证（用户体验）
const canApprove = user.permissions.includes('approve_drafts')

// 后端验证（安全保障）
// API 层必须再次验证权限
```

---

## 📱 移动端适配

### 响应式布局

```typescript
// 移动端隐藏侧边栏，使用底部导航
<div className="hidden md:block">
  <Sidebar />
</div>

<div className="md:hidden fixed bottom-0 w-full">
  <BottomNavigation />
</div>
```

### 触摸优化

```typescript
// 增大点击区域
<button className="min-h-[44px] min-w-[44px]">
  {/* 符合 iOS 人机界面指南 */}
</button>

// 支持滑动手势
import { useSwipeable } from 'react-swipeable'

const handlers = useSwipeable({
  onSwipedLeft: () => closeInbox(),
  onSwipedRight: () => openInbox(),
})

<div {...handlers}>
  <InboxPanel />
</div>
```

### PWA 支持

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // ... other config
})
```

---

## 🎓 开发者指南

### 开发环境设置

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 运行测试
npm test

# 4. 运行 E2E 测试
npm run test:e2e

# 5. 构建生产版本
npm run build
```

### 代码规范

```typescript
// 使用 ESLint 和 Prettier
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

### Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/floating-inbox

# 2. 提交代码
git commit -m "feat(workspace): add floating inbox component"

# 3. 推送并创建 PR
git push origin feature/floating-inbox

# 4. Code Review 后合并
```

### 组件开发模板

```typescript
// components/workspace/TaskCard.tsx
import { FC } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InboxItem } from '@/types'

interface TaskCardProps {
  task: InboxItem
  onActionClick?: (actionId: string) => void
}

export const TaskCard: FC<TaskCardProps> = ({ task, onActionClick }) => {
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>

      <div className="mt-4 flex gap-2">
        {task.actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            onClick={() => onActionClick?.(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  )
}
```

---

**文档版本**: v1.0
**最后更新**: 2025-10-24
**维护者**: GeoCMS UX Team

