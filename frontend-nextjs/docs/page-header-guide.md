# 页面标题统一化指南

## PageHeader 组件

已创建统一的页面标题组件:`src/components/ui/page-header.tsx`

### 特点
- 统一字体大小:`text-2xl` (24px)
- 适配中文界面的视觉层级
- 支持描述文字、操作按钮、图标等

### 使用方法

```typescript
import { PageHeader } from '@/components/ui/page-header'

// 基本用法
<PageHeader title="页面标题" description="页面描述" />

// 带操作按钮
<PageHeader 
  title="页面标题" 
  description="页面描述"
  actions={<button>操作按钮</button>}
/>

// 带图标
<PageHeader 
  title="页面标题"
  icon={<Icon className="h-6 w-6" />}
/>
```

### 待更新页面列表

以下页面需要将硬编码的标题替换为 PageHeader 组件:

**已更新:**
- ✅ `/dashboard/team-calls/scorecard` - 评分看板
- ✅ `/dashboard/team-calls/prompts` - AI 提示词
- ✅ `/dashboard/team-calls/config` - 通话配置
- ✅ `/dashboard/team-calls/call-list` - 团队通话列表  
- ✅ `/dashboard/team-calls/analytics` - 评分系统分析仪表板
- ✅ `/dashboard/team-calls/score-details` - 分数明细
- ✅ `/dashboard/team-calls/ai-audit` - AI 审计 & 调试

**待更新:**
- ❌ `/dashboard/team` - 团队管理
- ❌ `/dashboard/tasks` - 任务
- ❌ `/dashboard/tags` - Tags
- ❌ `/dashboard/settings` - Settings
- ❌ `/dashboard` - Dashboard
- ❌ `/dashboard/knowledge/[id]` - 知识详情
- ❌ `/dashboard/knowledge` - Knowledge Base Management
- ❌ `/dashboard/categories` - Categories
- ❌ `/dashboard/calendar` - Content Calendar
- ❌ `/dashboard/activity` - Activity

### 好处

1. **统一性**: 所有页面标题样式一致
2. **可维护性**: 修改字体大小只需要在一处修改
3. **响应式**: 未来可以轻松添加响应式字体
4. **可扩展**: 支持图标、操作按钮等扩展功能

### 全局调整

如果将来需要调整所有页面标题的字体大小,只需修改 `page-header.tsx`:

```typescript
// 当前: text-2xl (24px)
<Component className="text-2xl font-bold ...">

// 如需调整为更大: text-3xl (30px)
<Component className="text-3xl font-bold ...">
```

一次修改,全站生效!
