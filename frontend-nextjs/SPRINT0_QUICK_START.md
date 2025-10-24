# Sprint 0 - 快速开始指南

**版本**：v0.4  
**日期**：2025-01-24

---

## 🚀 快速启动

### 1. 安装依赖
```bash
cd frontend-nextjs
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问新功能
- **媒体库**：http://localhost:3000/dashboard/media
- **发布管理**：http://localhost:3000/dashboard/publishing
- **模板管理**：http://localhost:3000/dashboard/templates

---

## 📚 功能概览

### 媒体库 (Media Library)
**路由**：`/dashboard/media`

**功能**：
- 📊 网格/列表视图切换
- 🔍 搜索媒体文件
- 🏷️ 按类型筛选（图片/视频/文档）
- 📈 统计信息展示
- 🗑️ 删除媒体

**Demo 数据**：10 个示例媒体文件

**API 端点**：
```
GET    /api/media              # 获取列表
POST   /api/media              # 上传媒体
GET    /api/media/:id          # 获取详情
PUT    /api/media/:id          # 更新元数据
DELETE /api/media/:id          # 删除媒体
```

---

### 发布管理 (Publishing Management)
**路由**：`/dashboard/publishing`

**功能**：
- 📋 发布列表展示
- 🔄 状态筛选（草稿/待审核/已发布/已归档）
- 📝 发布检查清单
- 📊 发布历史记录
- ⚙️ 状态管理

**Demo 数据**：5 个示例发布项

**API 端点**：
```
GET    /api/publishing         # 获取列表
POST   /api/publishing         # 创建发布
GET    /api/publishing/:id     # 获取详情
PATCH  /api/publishing/:id     # 更新状态
DELETE /api/publishing/:id     # 删除发布
```

---

### 模板管理 (Template Management)
**路由**：`/dashboard/templates`

**功能**：
- 📑 模板列表展示
- 🏷️ 分类筛选（博客/网站/产品/FAQ/自定义）
- 🔍 搜索模板
- 📊 使用统计
- 🔤 模板变量显示

**Demo 数据**：10 个预设模板

**API 端点**：
```
GET    /api/templates          # 获取列表
POST   /api/templates          # 创建模板
GET    /api/templates/:id      # 获取详情
PUT    /api/templates/:id      # 更新模板
DELETE /api/templates/:id      # 删除模板
```

---

## 🧪 测试 API

### 使用 curl 测试

#### 媒体库
```bash
# 获取所有媒体
curl http://localhost:3000/api/media

# 按类型筛选
curl http://localhost:3000/api/media?type=image

# 搜索
curl http://localhost:3000/api/media?search=product

# 获取单个
curl http://localhost:3000/api/media/1
```

#### 发布管理
```bash
# 获取所有发布
curl http://localhost:3000/api/publishing

# 按状态筛选
curl http://localhost:3000/api/publishing?status=published

# 按渠道筛选
curl http://localhost:3000/api/publishing?channel=blog

# 获取单个
curl http://localhost:3000/api/publishing/1
```

#### 模板管理
```bash
# 获取所有模板
curl http://localhost:3000/api/templates

# 按分类筛选
curl http://localhost:3000/api/templates?category=blog

# 搜索
curl http://localhost:3000/api/templates?search=blog

# 获取单个
curl http://localhost:3000/api/templates/1
```

---

## 📁 文件结构

```
frontend-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── media/              # 媒体库 API
│   │   │   ├── publishing/         # 发布管理 API
│   │   │   └── templates/          # 模板管理 API
│   │   └── dashboard/
│   │       ├── media/              # 媒体库页面
│   │       ├── publishing/         # 发布管理页面
│   │       └── templates/          # 模板管理页面
│   ├── lib/data/
│   │   ├── media.json              # 媒体库 Demo 数据
│   │   ├── publishing.json         # 发布管理 Demo 数据
│   │   └── templates.json          # 模板管理 Demo 数据
│   └── types/index.ts              # 类型定义
├── __tests__/api/                  # API 测试
├── SPRINT0_TESTING.md              # 测试验证文档
├── SPRINT0_IMPLEMENTATION.md       # 实现总结文档
└── SPRINT0_QUICK_START.md          # 本文档
```

---

## 🔧 开发指南

### 添加新的媒体类型
编辑 `src/lib/data/media.json`，添加新项：
```json
{
  "id": 11,
  "filename": "new-file.jpg",
  "type": "image",
  "url": "https://example.com/image.jpg",
  "size": 1024000,
  "tags": ["tag1", "tag2"],
  "description": "Description",
  "uploadedAt": "2025-01-24T10:00:00Z",
  "usedIn": []
}
```

### 添加新的发布状态
编辑 `src/types/index.ts` 中的 `Publishing` 接口：
```typescript
status: 'draft' | 'pending_review' | 'published' | 'archived' | 'new_status'
```

### 添加新的模板分类
编辑 `src/types/index.ts` 中的 `Template` 接口：
```typescript
category: 'blog' | 'website' | 'product' | 'faq' | 'custom' | 'new_category'
```

---

## 📊 性能指标

### 构建性能
- 构建时间：< 1 分钟
- 首页加载 JS：87.2 kB
- 页面大小：98-179 kB

### 功能完成度
- 媒体库：100%
- 发布管理：100%
- 模板管理：100%

---

## 🐛 常见问题

### Q: 如何添加新的媒体文件？
A: 在 `src/lib/data/media.json` 中添加新项，或通过 `POST /api/media` 端点。

### Q: 如何修改发布状态？
A: 在发布管理页面的详情面板中点击状态按钮，或通过 `PATCH /api/publishing/:id` 端点。

### Q: 如何创建新模板？
A: 在模板管理页面点击"新建模板"按钮，或通过 `POST /api/templates` 端点。

### Q: 如何搜索媒体？
A: 在媒体库页面的搜索框中输入关键词，支持按文件名和描述搜索。

---

## 📝 相关文档

- [SPRINT0_TESTING.md](./SPRINT0_TESTING.md) - 完整的测试验证清单
- [SPRINT0_IMPLEMENTATION.md](./SPRINT0_IMPLEMENTATION.md) - 实现总结和技术细节
- [../docs/SPRINT0_COMPLETION_REPORT.md](../docs/SPRINT0_COMPLETION_REPORT.md) - 完成报告

---

## 🚀 下一步

1. **集成测试**：测试新模块与现有模块的集成
2. **性能优化**：优化大数据集的加载性能
3. **功能扩展**：添加批量操作、高级搜索等功能
4. **用户反馈**：收集用户反馈并改进

---

**最后更新**：2025-01-24  
**维护者**：GeoCMS Team  
**状态**：✅ 完成

