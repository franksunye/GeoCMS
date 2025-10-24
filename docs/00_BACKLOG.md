# GeoCMS Development Backlog

> **Note**: This document contains only pending development tasks. Completed work can be found in [CHANGELOG.md](01_CHANGELOG.md), and product vision and roadmap in [ROADMAP.md](00_ROADMAP.md).

**Last Updated**: 2025-01-24
**Current Sprint**: Sprint 1 - Categories, Tags, Settings & Calendar (COMPLETED) ✅
**Current Version**: v0.4 (Core Modules Complete)
**Target Version**: v0.5 (Productized Version)

---

## ✅ COMPLETED: Sprint 1 - Categories, Tags, Settings & Calendar

**Completion Date**: 2025-01-24
**Status**: Frontend Implementation Complete

### Delivered Features

#### 1. Categories Management (`/dashboard/categories`)
- [x] Hierarchical category management with parent-child relationships
- [x] Expandable/collapsible category tree view
- [x] Create, edit, delete operations with dialog forms
- [x] Color-coded categories for visual organization
- [x] Item count display per category
- [x] Demo data: 5 top-level categories with 5 subcategories
- [x] Form validation with Zod schema

#### 2. Tags Management (`/dashboard/tags`)
- [x] Tag management with search functionality
- [x] Grid-based card layout for tags
- [x] Bulk selection and deletion operations
- [x] Create, edit, delete operations
- [x] Color-coded tags for visual distinction
- [x] Demo data: 10 tags with descriptions and usage counts
- [x] Form validation with Zod schema

#### 3. Settings Center (`/dashboard/settings`)
- [x] 4 Configuration Tabs:
  - [x] Brand Settings (name, voice, keywords, style guide)
  - [x] AI Configuration (model, temperature, max tokens, system prompt)
  - [x] Publishing Settings (default category, status, channels)
  - [x] System Settings (language, timezone, notifications)
- [x] Form validation and save functionality
- [x] Toast notifications for user feedback
- [x] Complete demo configuration data

#### 4. Content Calendar (`/dashboard/calendar`)
- [x] Month view calendar with full grid display
- [x] Navigation between months (prev/next)
- [x] Event display with status indicators
- [x] Color-coded status badges (draft, scheduled, published, archived)
- [x] Event filtering by status and category
- [x] Event details modal
- [x] Upcoming events sidebar
- [x] Demo data: 10 events across January-February

#### 5. UI Components & Infrastructure
- [x] Tabs component (from @radix-ui/react-tabs)
- [x] Select component (from @radix-ui/react-select)
- [x] Navigation updated with 4 new menu items
- [x] Demo data JSON files for all modules
- [x] TypeScript type fixes for existing code

### Build & Deployment
- [x] Successfully compiles with no errors
- [x] All TypeScript checks pass
- [x] All dependencies available
- [x] Committed to main branch
- [x] Pushed to GitHub

---

---

## 📋 Task Priority Guide

- **P0** - Core functionality, must complete (current Sprint)
- **P1** - Important functionality, should complete (next 1-2 Sprints)
- **P2** - Enhancement functionality, can complete (future Sprints)
- **P3** - Optimization functionality, do if time permits

---

## 🎯 Sprint 2: 核心内容管理模块（Week 1-3，当前）🔥

**目标**：实现媒体库、发布管理、模板管理三个核心模块，完成内容生产闭环

**背景**：参考 WordPress、Drupal 等主流 CMS，补充 GeoCMS 缺失的核心功能模块，支撑"知识积累 → 策划 → 生成 → 编辑 → 发布"完整流程

### P0 - 必须完成

#### 1️⃣ 媒体库 (Media Library) - Week 1

**功能需求**：
- [ ] **媒体上传和管理**
  - [ ] 支持图片、视频、文档上传
  - [ ] 文件预览（图片缩略图、文档图标）
  - [ ] 文件元数据编辑（标题、描述、标签）
  - [ ] 文件删除和批量删除
  - [ ] 文件搜索和筛选（按类型、日期、标签）

- [ ] **媒体库页面** (`/dashboard/media`)
  - [ ] 网格视图和列表视图切换
  - [ ] 文件夹/分类组织
  - [ ] 上传进度显示
  - [ ] 拖拽上传支持

- [ ] **媒体选择器组件**
  - [ ] 在策划和草稿中集成
  - [ ] 快速选择和插入媒体
  - [ ] 媒体预览

- [ ] **Demo 数据**
  - [ ] 10+ 个示例媒体文件
  - [ ] 包含图片、视频、文档

- [ ] **API Routes**
  - [ ] `GET /api/media` - 获取媒体列表
  - [ ] `POST /api/media` - 上传媒体
  - [ ] `GET /api/media/:id` - 获取媒体详情
  - [ ] `PUT /api/media/:id` - 更新媒体元数据
  - [ ] `DELETE /api/media/:id` - 删除媒体

#### 2️⃣ 发布管理 (Publishing Management) - Week 2

**功能需求**：
- [ ] **发布流程管理**
  - [ ] 发布状态定义（草稿 → 待审核 → 已发布 → 已归档）
  - [ ] 状态流转和历史记录
  - [ ] 发布时间设置（立即/定时）
  - [ ] 发布渠道选择（博客、主站）

- [ ] **发布页面** (`/dashboard/publishing`)
  - [ ] 待发布内容列表
  - [ ] 发布检查清单
  - [ ] 发布预览
  - [ ] 发布历史记录

- [ ] **发布检查清单**
  - [ ] 标题检查
  - [ ] 关键词检查
  - [ ] 媒体检查
  - [ ] 内容长度检查
  - [ ] SEO 基础检查

- [ ] **发布历史**
  - [ ] 记录发布时间、发布者、发布渠道
  - [ ] 发布版本对比
  - [ ] 发布回滚功能

- [ ] **Demo 数据**
  - [ ] 5+ 个不同状态的内容

- [ ] **API Routes**
  - [ ] `GET /api/publishing` - 获取发布列表
  - [ ] `POST /api/publishing` - 创建发布任务
  - [ ] `GET /api/publishing/:id` - 获取发布详情
  - [ ] `PATCH /api/publishing/:id` - 更新发布状态
  - [ ] `DELETE /api/publishing/:id` - 删除发布任务

#### 3️⃣ 模板管理 (Template Management) - Week 2-3

**功能需求**：
- [ ] **模板库**
  - [ ] 预设模板（博客、主站、产品介绍、FAQ 等）
  - [ ] 模板分类和标签
  - [ ] 模板搜索和筛选
  - [ ] 模板预览

- [ ] **模板编辑器**
  - [ ] 创建自定义模板
  - [ ] 编辑模板结构和变量
  - [ ] 模板变量定义（{{title}}, {{keywords}} 等）
  - [ ] 模板预览

- [ ] **模板应用**
  - [ ] 从模板快速创建策划
  - [ ] 从模板快速创建草稿
  - [ ] 模板变量自动填充

- [ ] **模板管理页面** (`/dashboard/templates`)
  - [ ] 模板列表
  - [ ] 创建/编辑/删除模板
  - [ ] 模板使用统计

- [ ] **Demo 数据**
  - [ ] 8-10 个预设模板
  - [ ] 包含不同内容类型

- [ ] **API Routes**
  - [ ] `GET /api/templates` - 获取模板列表
  - [ ] `POST /api/templates` - 创建模板
  - [ ] `GET /api/templates/:id` - 获取模板详情
  - [ ] `PUT /api/templates/:id` - 更新模板
  - [ ] `DELETE /api/templates/:id` - 删除模板

### P1 - 应该完成

- [ ] **集成优化**
  - [ ] 媒体库与策划/草稿集成
  - [ ] 模板与策划/草稿集成
  - [ ] 发布与草稿集成

- [ ] **用户体验**
  - [ ] 加载骨架屏
  - [ ] 空状态设计
  - [ ] 错误提示优化

---

## 🎯 Sprint 3: Agent工作台基础（Week 4-5）

**目标**：实现Agent工作进展可视化，让用户看到AI的工作过程

### P0 - 必须完成

#### 后端API开发
- [ ] **Agent Runs API**
  - [ ] GET `/api/agent/runs` - 获取所有runs（支持状态过滤）
  - [ ] GET `/api/agent/runs/:id` - 获取单个run详情
  - [ ] GET `/api/agent/runs/:id/tasks` - 获取run的所有tasks
  - [ ] PATCH `/api/agent/runs/:id` - 更新run状态（取消等）

- [ ] **Agent Tasks API**
  - [ ] GET `/api/agent/tasks/:id` - 获取单个task详情
  - [ ] GET `/api/agent/tasks/:id/logs` - 获取task日志（如果有）

#### 前端组件开发
- [ ] **Agent工作台摘要组件**（概览页）
  - [ ] 活跃任务卡片（显示前3-5个）
  - [ ] 进度条组件
  - [ ] 当前Agent状态显示
  - [ ] "查看全部"链接

- [ ] **任务监控页面**（新页面）
  - [ ] 页面路由：`/dashboard/tasks`
  - [ ] 活跃任务列表
  - [ ] 任务时间线组件
  - [ ] 任务详情展开/折叠
  - [ ] 历史记录区域（可折叠）

- [ ] **导航栏更新**
  - [ ] 添加"任务"导航项
  - [ ] 活跃任务数量徽章
  - [ ] 图标选择（Activity或ListTodo）

#### 实时更新
- [ ] **React Query配置**
  - [ ] 配置自动刷新（refetchInterval: 3000ms）
  - [ ] 配置缓存策略
  - [ ] 错误重试机制

### P1 - 应该完成
- [ ] **交互功能**
  - [ ] 点击任务查看详情
  - [ ] 取消正在运行的任务
  - [ ] 任务状态筛选

- [ ] **视觉优化**
  - [ ] 状态变化动画
  - [ ] 加载骨架屏
  - [ ] 空状态设计

---

## 📚 Sprint 4: 知识库产品化（Week 6-7）

**目标**：提升知识库模块的产品化程度，增加实用功能

### P0 - 必须完成

#### 使用统计
- [ ] **引用追踪**
  - [ ] 记录知识条目被引用的次数
  - [ ] 显示最近使用时间
  - [ ] 使用趋势图表（简单的折线图）

- [ ] **统计展示**
  - [ ] 知识列表显示引用次数
  - [ ] 排序选项（按引用次数、最近使用）
  - [ ] 热门知识Top 10

#### 质量指标
- [ ] **内容完整度**
  - [ ] 计算内容完整度评分（基于字段填充）
  - [ ] 显示评分徽章
  - [ ] 不完整内容提醒

- [ ] **更新管理**
  - [ ] 显示最后更新时间
  - [ ] 过期内容警告（超过90天未更新）
  - [ ] 批量更新时间戳

#### 智能推荐
- [ ] **基于任务推荐**
  - [ ] 分析当前任务关键词
  - [ ] 推荐相关知识条目
  - [ ] 侧边栏推荐组件

- [ ] **缺失知识提醒**
  - [ ] 检测常用但缺失的知识
  - [ ] 提示用户补充
  - [ ] 快速创建入口

#### 批量操作
- [ ] **导入导出**
  - [ ] JSON格式导出
  - [ ] JSON格式导入
  - [ ] CSV格式支持

- [ ] **批量编辑**
  - [ ] 多选功能
  - [ ] 批量添加标签
  - [ ] 批量归档/删除

### P1 - 应该完成
- [ ] **搜索增强**
  - [ ] 全文搜索
  - [ ] 标签过滤
  - [ ] 高级搜索选项

---

## ✍️ Sprint 5: 策划和草稿产品化（Week 8-9）

**目标**：提升策划和草稿模块的产品化程度

### P0 - 必须完成

#### 策划模块增强
- [ ] **看板视图**
  - [ ] 看板布局（待开始/进行中/已完成）
  - [ ] 拖拽改变状态
  - [ ] 卡片详情展示

- [ ] **模板系统**
  - [ ] 预设模板（5-10个常用模板）
  - [ ] 自定义模板保存
  - [ ] 从模板快速创建

- [ ] **进度可视化**
  - [ ] 进度条显示
  - [ ] 里程碑标记
  - [ ] 完成度统计

- [ ] **时间管理**
  - [ ] 截止日期设置
  - [ ] 日期提醒
  - [ ] 时间估算

#### 草稿模块增强
- [ ] **版本控制**
  - [ ] 自动保存历史版本
  - [ ] 版本列表展示
  - [ ] 版本对比（diff）
  - [ ] 回滚到历史版本

- [ ] **预览增强**
  - [ ] 实时预览（Markdown渲染）
  - [ ] 多设备预览（桌面/平板/手机）
  - [ ] 分享预览链接

- [ ] **发布流程**
  - [ ] 发布前检查清单
  - [ ] 状态流转（草稿→审核→发布）
  - [ ] 定时发布

- [ ] **内容分析**
  - [ ] 字数统计
  - [ ] 阅读时间估算
  - [ ] 基础SEO建议

### P1 - 应该完成
- [ ] **协作功能**（为未来准备）
  - [ ] 评论系统
  - [ ] 任务分配
  - [ ] 状态变更历史

---

## 🔄 Sprint 6: 实时更新和交互优化（Week 10-11）

**目标**：提升系统的实时性和交互体验
### P0 - 必须完成

#### WebSocket实时通信
- [ ] **后端WebSocket**
  - [ ] WebSocket服务器配置
  - [ ] 连接管理
  - [ ] 消息广播
  - [ ] 心跳检测

- [ ] **前端WebSocket**
  - [ ] WebSocket客户端
  - [ ] 自动重连
  - [ ] 消息队列
  - [ ] 状态同步

#### 乐观更新
- [ ] **Optimistic Updates**
  - [ ] 立即更新UI
  - [ ] 后台同步
  - [ ] 失败回滚
  - [ ] 冲突解决

#### 加载状态优化
- [ ] **骨架屏**
  - [ ] 列表骨架屏
  - [ ] 卡片骨架屏
  - [ ] 表单骨架屏

- [ ] **加载指示器**
  - [ ] 全局加载条
  - [ ] 按钮加载状态
  - [ ] 局部加载动画

#### 错误处理
- [ ] **错误边界**
  - [ ] React Error Boundary
  - [ ] 错误页面
  - [ ] 错误上报

- [ ] **重试机制**
  - [ ] 自动重试
  - [ ] 手动重试按钮
  - [ ] 重试次数限制

### P1 - 应该完成
- [ ] **动画和过渡**
  - [ ] 页面切换动画
  - [ ] 列表项动画
  - [ ] 状态变化动画

---

## 🚀 Sprint 7: 性能和稳定性（Week 12-13）

**目标**：优化性能，提升稳定性，准备发布

### P0 - 必须完成

#### 性能优化
- [ ] **代码优化**
  - [ ] 代码分割（按路由）
  - [ ] 懒加载组件
  - [ ] Tree shaking
  - [ ] 图片优化

- [ ] **缓存策略**
  - [ ] React Query缓存配置
  - [ ] 浏览器缓存策略
  - [ ] API响应缓存

#### 测试完善
- [ ] **单元测试**
  - [ ] 组件测试（Jest + React Testing Library）
  - [ ] 工具函数测试
  - [ ] Hook测试
  - [ ] 目标覆盖率：85%

- [ ] **集成测试**
  - [ ] API集成测试
  - [ ] 关键流程测试
  - [ ] 错误场景测试

#### 文档更新
- [ ] **技术文档**
  - [ ] 更新API文档
  - [ ] 更新架构文档
  - [ ] 更新开发文档

- [ ] **用户文档**
  - [ ] 功能使用指南
  - [ ] 常见问题FAQ
  - [ ] 视频教程（可选）

#### 生产部署准备
- [ ] **部署配置**
  - [ ] 环境变量配置
  - [ ] 构建优化
  - [ ] 错误监控（Sentry）
  - [ ] 性能监控

### P1 - 应该完成
- [ ] **监控和日志**
  - [ ] 日志系统
  - [ ] 性能监控
  - [ ] 用户行为分析

---

## 🔮 未来规划（暂不实施）

以下功能暂不列入当前开发计划，待v0.5版本稳定后再评估：

### 高级可视化
- 3D Agent可视化
- 3D知识图谱
- 思维链可视化

### 高级编辑器
- 富文本块编辑器
- 实时协作编辑
- AI魔法工具栏

### 企业级功能
- 权限管理系统
- 审批流程
- SSO集成
- 审计日志

### 多模态功能
- 图像生成
- 视频处理
- 语音合成
- 音频处理

---

## 📝 技术债务

### 代码质量
- [ ] 提升TypeScript覆盖率到95%
- [ ] 重构大型组件（>300行）
- [ ] 统一错误处理机制
- [ ] 优化状态管理

### 性能优化
- [ ] 优化大列表渲染（虚拟滚动）
- [ ] 减少不必要的重渲染
- [ ] 优化图片加载
- [ ] 减少Bundle大小

### 测试
- [ ] 提升单元测试覆盖率到85%
- [ ] 添加E2E测试
- [ ] 添加视觉回归测试
- [ ] 性能基准测试

---

## 📌 备注

### 任务管理规范
1. **任务状态**：使用 `[ ]` 表示未完成，`[x]` 表示已完成
2. **优先级**：P0 > P1 > P2 > P3
3. **Sprint周期**：每个Sprint为2周
4. **任务粒度**：每个任务应在1-3天内完成
5. **完成标准**：代码审查通过 + 测试通过 + 文档更新

### 更新流程
1. 完成任务后，标记为 `[x]`
2. 将完成的任务移到 `CHANGELOG.md`
3. 每个Sprint结束时，更新当前Sprint
4. 定期回顾，调整优先级

### 开发原则
1. **聚焦产品化**：注重细节和用户体验，而非炫酷功能
2. **实用优先**：优先开发实用功能，暂缓高级可视化
3. **迭代开发**：小步快跑，快速迭代
4. **测试驱动**：保持高测试覆盖率

### 相关文档
- [CHANGELOG.md](01_CHANGELOG.md) - 变更日志
- [ROADMAP.md](00_ROADMAP.md) - 产品路线图
- [ARCHITECTURE.md](10_ARCHITECTURE.md) - 技术架构
- [REFERENCES.md](00_REFERENCES.md) - 参考资源

---

**最后更新**：2025-01-24
**维护者**：GeoCMS Team
**版本**：v4.0 - 完成Sprint 1前端实现（Categories, Tags, Settings, Calendar）
