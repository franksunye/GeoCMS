# GeoCMS Frontend 文档中心

欢迎来到 GeoCMS 前端文档中心。本目录包含所有前端相关的设计文档、技术规范和开发指南。

---

## 📚 文档索引

### 🎯 AI Native Workspace 升级

**主文档**: [AI_NATIVE_WORKSPACE_UPGRADE.md](./AI_NATIVE_WORKSPACE_UPGRADE.md)

这是 GeoCMS 前端工作台向 AI Native 架构升级的完整设计方案，包括：

- **设计理念**: 从功能导航到任务参与的范式转变
- **核心改进**: 5 大改进方向
  1. 任务优先的首页重构
  2. 浮动交互面板 (Floating Action Panel)
  3. AI 智能助手入口
  4. 导航优化 - 从模块到任务流
  5. 人员和进展可视化
- **技术实施**: 技术栈选择、组件架构、API 设计
- **实施路线图**: 6 个阶段的详细计划
- **成功指标**: 用户体验、技术和业务指标

**适合阅读对象**:
- 产品经理：了解设计理念和用户价值
- UX 设计师：理解交互设计和视觉规范
- 前端开发：掌握技术实施方案
- 项目经理：制定开发计划和时间表

---

### 🛠️ 组件详细规范

**文档**: [COMPONENT_SPECIFICATIONS.md](./COMPONENT_SPECIFICATIONS.md)

提供具体的组件实现规范，包括完整的代码示例：

- **FloatingInbox 组件**: 浮动收件箱的完整实现
- **AIAssistant 组件**: AI 助手聊天界面
- **ActionItemsPanel 组件**: 首页待办任务面板
- **CollapsibleSidebar 组件**: 可收起侧边栏
- **EnhancedAgentStatusBar 组件**: 增强的 Agent 状态栏

每个组件包含：
- 视觉设计规范
- 完整的 TypeScript 代码
- 交互细节说明
- Props 接口定义
- 状态管理方案

**适合阅读对象**:
- 前端开发：直接参考代码实现
- UX 设计师：了解组件交互细节
- QA 测试：理解组件行为用于测试

---

## 🚀 快速开始

### 对于产品经理和设计师

1. 阅读 [AI_NATIVE_WORKSPACE_UPGRADE.md](./AI_NATIVE_WORKSPACE_UPGRADE.md) 的前三章：
   - 设计理念
   - 核心改进方向
   - 详细设计方案

2. 查看实施路线图，了解开发计划

3. 参考成功指标，制定验收标准

### 对于前端开发人员

1. **第一步**: 阅读 [AI_NATIVE_WORKSPACE_UPGRADE.md](./AI_NATIVE_WORKSPACE_UPGRADE.md) 的技术实施建议章节

2. **第二步**: 查看 [COMPONENT_SPECIFICATIONS.md](./COMPONENT_SPECIFICATIONS.md) 了解具体组件实现

3. **第三步**: 按照实施路线图开始开发：
   ```bash
   # Phase 1: 基础架构
   npm install framer-motion
   
   # 创建组件目录
   mkdir -p src/components/workspace
   mkdir -p src/components/navigation
   
   # 开始实现第一个组件
   # 参考 COMPONENT_SPECIFICATIONS.md 中的代码示例
   ```

4. **第四步**: 运行测试确保质量
   ```bash
   npm test
   npm run test:e2e
   ```

### 对于项目经理

1. 查看 [AI_NATIVE_WORKSPACE_UPGRADE.md](./AI_NATIVE_WORKSPACE_UPGRADE.md) 的实施路线图

2. 了解 6 个阶段的时间估算：
   - Phase 1: 基础架构 (1-2 周)
   - Phase 2: 数据集成 (1-2 周)
   - Phase 3: 首页重构 (1 周)
   - Phase 4: 导航优化 (1 周)
   - Phase 5: 可视化增强 (1 周)
   - Phase 6: 优化和测试 (1 周)
   
   **总计**: 6-8 周

3. 制定里程碑和验收标准

---

## 📖 相关文档

### 现有文档

- [README.md](../README.md) - 项目总览和快速开始
- [UI_DESIGN_PRINCIPLES.md](../UI_DESIGN_PRINCIPLES.md) - Icons vs Avatars 设计原则
- [TESTING.md](../TESTING.md) - 测试指南
- [DEPLOYMENT.md](../DEPLOYMENT.md) - 部署指南

### 后端文档

- [API 文档](../../docs/API.md) - 后端 API 接口文档
- [AI Native 架构](../../docs/AI_NATIVE_ARCHITECTURE.md) - AI Native 系统架构

---

## 🎯 设计原则总结

### 1. 任务与目标并重 (Task & Goal Balance)
用户既要知道"我现在要做什么"（任务执行），也要了解"我们做得怎么样"（目标达成）。首页同时展示待办任务和核心 KPI。

### 2. 快速参与 (Quick Action)
用户应该能在 3 次点击内完成大部分操作，浮动面板提供一键操作。

### 3. 上下文感知 (Context-Aware)
AI 助手和推荐系统应该知道用户当前在做什么，提供相关建议。同时，KPI 异常会触发相关任务提醒。

### 4. 进展可视 (Progress Visible)
用户应该随时了解：
- 任务进展（Agent 工作状态、任务完成度）
- 目标进展（KPI 趋势、周/月目标达成情况）

### 5. 数据驱动决策 (Data-Driven)
内容营销的核心 KPI（产出、质量、效率、覆盖）始终可见，支持快速决策和策略调整。

### 6. 简洁优雅 (Simple & Elegant)
简化导航，但保留必要的功能入口和 KPI 访问路径，让界面简洁但功能强大。

---

## 🔧 技术栈

### 核心框架
- **Next.js 14**: App Router
- **React 18**: 服务端组件 + 客户端组件
- **TypeScript**: 类型安全

### UI 组件
- **shadcn/ui**: 基于 Radix UI 的组件库
- **Tailwind CSS**: 样式系统
- **Framer Motion**: 动画库

### 状态管理
- **React Query**: 服务端状态管理
- **Zustand**: 客户端状态管理

### 工具库
- **date-fns**: 日期处理
- **lucide-react**: 图标库

---

## 📊 开发进度追踪

### Phase 1: 基础架构 ⏳
- [ ] 安装依赖
- [ ] 创建组件目录结构
- [ ] 实现 FloatingInbox 基础组件
- [ ] 实现 AIAssistant 基础组件
- [ ] 实现 CollapsibleSidebar 组件

### Phase 2: 数据集成 📋
- [ ] 设计 Inbox API
- [ ] 实现数据获取和缓存
- [ ] 集成 AI Native Chat API
- [ ] 实现实时更新

### Phase 3: 首页重构 📋
- [ ] 创建 ActionItemsPanel
- [ ] 增强 TeamStatusBar
- [ ] 重新排列首页布局
- [ ] 实现角色定制

### Phase 4: 导航优化 📋
- [ ] 简化导航结构
- [ ] 实现收起/展开动画
- [ ] 添加面包屑
- [ ] 实现快捷键

### Phase 5: 可视化增强 📋
- [ ] 增强 Agent 状态卡片
- [ ] 实现任务流程可视化
- [ ] 增强活动时间线

### Phase 6: 优化和测试 📋
- [ ] 性能优化
- [ ] 无障碍性测试
- [ ] 跨浏览器测试
- [ ] 用户测试

---

## 🤝 贡献指南

### 代码规范

遵循项目的 ESLint 和 Prettier 配置：

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

### 提交规范

使用 Conventional Commits 规范：

```
feat(workspace): add floating inbox component
fix(assistant): resolve chat scroll issue
docs(upgrade): update implementation guide
style(ui): adjust spacing in task cards
refactor(navigation): simplify sidebar logic
test(inbox): add unit tests for task filtering
```

### Pull Request 流程

1. 从 `main` 分支创建功能分支
2. 实现功能并编写测试
3. 确保所有测试通过
4. 提交 PR 并请求 Code Review
5. 根据反馈修改
6. 合并到 `main`

---

## 📞 联系方式

如有问题或建议，请联系：

- **技术问题**: 在 GitHub 创建 Issue
- **设计讨论**: 联系 UX 团队
- **项目管理**: 联系项目经理

---

## 📝 更新日志

### v1.0 (2025-10-24)
- ✅ 创建 AI Native Workspace 升级方案文档
- ✅ 创建组件详细规范文档
- ✅ 定义实施路线图
- ✅ 建立文档索引

---

**文档维护**: GeoCMS Frontend Team  
**最后更新**: 2025-10-24

