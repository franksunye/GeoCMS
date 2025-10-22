# GeoCMS Frontend

基于 Next.js 14 的 GeoCMS 前端应用。

## 功能特性

- 📚 **知识库管理** - 管理品牌知识和资料
- 📝 **内容策划** - 创建和管理内容计划
- ✍️ **草稿管理** - 查看和编辑内容草稿
- 📊 **数据统计** - 实时查看系统统计信息

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Query + Zustand
- **UI 组件**: Radix UI
- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # 仪表板页面
│   ├── api/               # API Routes
│   └── layout.tsx         # 根布局
├── components/            # React 组件
├── lib/                   # 工具函数和配置
│   ├── api/              # API 客户端
│   ├── data/             # Demo 数据
│   └── utils.ts          # 工具函数
└── types/                # TypeScript 类型定义
```

## Demo 数据

应用使用 JSON 文件存储 demo 数据，包括：

- `knowledge.json` - 10+ 条知识库示例
- `plans.json` - 5+ 条内容策划示例
- `drafts.json` - 3+ 条草稿示例

数据通过 Next.js API Routes 提供，支持完整的 CRUD 操作。

## 部署

### Vercel (推荐)

```bash
vercel
```

### 其他平台

构建静态文件：

```bash
npm run build
```

## 开发指南

### 添加新页面

1. 在 `src/app/(dashboard)/` 下创建新目录
2. 添加 `page.tsx` 文件
3. 在 `layout.tsx` 中添加导航链接

### 添加新 API

1. 在 `src/app/api/` 下创建新目录
2. 添加 `route.ts` 文件
3. 实现 GET/POST/PUT/DELETE 方法

## License

MIT

