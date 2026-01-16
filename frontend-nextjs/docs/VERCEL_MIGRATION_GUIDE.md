# Vercel + Supabase 迁移指南

本文档描述如何将 GeoCMS Frontend 部署到 Vercel，同时保持本地 SQLite 开发体验。

## 📐 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        开发环境                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Next.js   │───▶│   Prisma    │───▶│   SQLite    │     │
│  │   Dev       │    │   Client    │    │   (local)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        生产环境 (Vercel)                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Next.js   │───▶│   Prisma    │───▶│  Supabase   │     │
│  │   Vercel    │    │   Client    │    │  PostgreSQL │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 迁移步骤

### 第一步：创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目，记录以下信息：
   - Project Ref: `[PROJECT-REF]`
   - Database Password: `[YOUR-PASSWORD]`
3. 获取连接字符串 (Settings > Database > Connection string):
   - **Pooled (for app)**: `postgresql://postgres:[PASSWORD]@[REF].pooler.supabase.com:6543/postgres`
   - **Direct (for migrations)**: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

### 第二步：配置本地环境变量

创建或更新 `.env.local`:

```bash
# 本地开发自动使用 SQLite，无需额外配置
# DATABASE_PROVIDER=sqlite  # 可选，默认值

# AI 服务配置
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key

# 七牛云存储
QINIU_ACCESS_KEY=your-qiniu-access-key
QINIU_SECRET_KEY=your-qiniu-secret-key
```

### 第三步：推送数据库结构到 Supabase

```bash
# 设置 PostgreSQL 环境变量
export DATABASE_PROVIDER=postgresql
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# 生成 PostgreSQL Prisma Client
npm run db:generate:pg

# 推送 schema 到 Supabase
npm run db:push:pg
```

### 第四步：数据迁移（可选）

如果需要将本地 SQLite 数据迁移到 Supabase：

**方案 A：使用 pgloader**
```bash
# 安装 pgloader
brew install pgloader  # macOS
# 或 apt-get install pgloader  # Linux

# 迁移数据
pgloader team-calls.db postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

**方案 B：使用导出/导入**
```bash
# 1. 使用 Prisma Studio 导出 JSON
npm run db:studio

# 2. 在 Supabase SQL Editor 导入
```

### 第五步：配置 Vercel

1. 连接 GitHub 仓库到 Vercel
2. 在 Vercel Dashboard > Settings > Environment Variables 添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://postgres:...@pooler.supabase.com:6543/postgres` | Production |
| `DATABASE_PROVIDER` | `postgresql` | Production |
| `DEEPSEEK_API_KEY` | `sk-...` | Production |
| `GEMINI_API_KEY` | `AIza...` | Production |
| `QINIU_ACCESS_KEY` | `...` | Production |
| `QINIU_SECRET_KEY` | `...` | Production |

### 第六步：部署

Vercel 已配置为自动使用 PostgreSQL schema：

```bash
# 推送到 GitHub 触发自动部署
git add .
git commit -m "feat: add Vercel + Supabase support"
git push origin main
```

Vercel 构建命令 (在 `vercel.json` 中配置):
```
prisma generate --schema=prisma/schema.postgres.prisma && next build
```

## 📁 文件结构

```
prisma/
├── schema.sqlite.prisma    # SQLite schema (本地开发)
├── schema.postgres.prisma  # PostgreSQL schema (Vercel/Supabase)
└── schema.prisma           # 原始 schema (可保留作参考)

prisma.config.ts            # Prisma 7 配置文件 (自动切换数据库)

src/lib/
└── prisma.ts               # 自动切换数据库的 Prisma 客户端
```

## 🔧 NPM 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (自动使用 SQLite) |
| `npm run db:generate` | 为 SQLite 生成 Prisma Client |
| `npm run db:generate:pg` | 为 PostgreSQL 生成 Prisma Client |
| `npm run db:push:pg` | 将 schema 推送到 Supabase |
| `npm run db:migrate:pg` | 创建 PostgreSQL 迁移文件 |
| `npm run db:studio` | 打开 SQLite 数据库浏览器 |
| `npm run db:studio:pg` | 打开 PostgreSQL 数据库浏览器 |

## ⚠️ 注意事项

### 1. Prisma 7 配置

Prisma 7 使用 `prisma.config.ts` 来配置数据源 URL，而不是在 schema 文件中：

```typescript
// prisma.config.ts
export default defineConfig({
  schema: isPostgres 
    ? "prisma/schema.postgres.prisma" 
    : "prisma/schema.sqlite.prisma",
  datasource: {
    url: isPostgres 
      ? process.env.DATABASE_URL 
      : "file:./team-calls.db",
  },
});
```

### 2. 数据类型差异

SQLite 和 PostgreSQL 有一些差异，schema 已经处理了大部分：

| SQLite | PostgreSQL |
|--------|------------|
| 无原生 Boolean | 使用 `boolean` |
| 无 JSON 类型 | 使用 `jsonb` |
| 自动递增 ID | 需要 `@default(cuid())` |
| camelCase 列名 | snake_case 列名 (通过 @map) |

### 3. 连接池

Supabase 使用 PgBouncer 连接池：
- **应用连接**: 使用 `pooler.supabase.com:6543` (端口 6543)
- **迁移连接**: 使用 `db.xxx.supabase.co:5432` (直接连接)

### 4. Native 模块

`better-sqlite3` 是 native 模块，不能在 Vercel 上运行。
`prisma.ts` 使用条件导入，只在本地加载它。

### 5. 安全

- ✅ 已移除代码中硬编码的 API Keys
- ✅ 所有敏感配置通过环境变量传递
- ⚠️ 确保 `.env.local` 在 `.gitignore` 中

## 🔍 故障排除

### 问题：Vercel 构建失败 - better-sqlite3

**原因**: Vercel 环境没有编译 native 模块的工具链

**解决**: 确保 `prisma.ts` 使用条件导入：
```typescript
if (databaseProvider === 'postgresql') {
    // PostgreSQL - 无需 adapter
} else {
    // 仅在本地加载 better-sqlite3
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
}
```

### 问题：Supabase 连接超时

**原因**: 使用了错误的连接端口

**解决**: 应用连接使用端口 `6543` (pooler)，迁移使用 `5432` (direct)

### 问题：数据类型不匹配

**原因**: SQLite 和 PostgreSQL 的类型系统差异

**解决**: 确保使用对应的 schema 文件，不要混用

## 🔗 相关链接

- [Supabase 文档](https://supabase.com/docs)
- [Prisma + Supabase 指南](https://www.prisma.io/docs/guides/database/supabase)
- [Prisma 7 配置指南](https://www.prisma.io/docs/orm/overview/prisma-schema/prisma-config)
- [Vercel 部署指南](https://vercel.com/docs/frameworks/nextjs)
