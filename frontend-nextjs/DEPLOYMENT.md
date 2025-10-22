# GeoCMS Frontend 部署指南

## 本地开发

### 1. 安装依赖

```bash
cd frontend-nextjs
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
npm start
```

## Vercel 部署（推荐）

### 方式一：通过 Vercel CLI

1. 安装 Vercel CLI

```bash
npm i -g vercel
```

2. 登录 Vercel

```bash
vercel login
```

3. 部署

```bash
cd frontend-nextjs
vercel
```

4. 生产部署

```bash
vercel --prod
```

### 方式二：通过 GitHub 集成

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入 GitHub 仓库 `franksunye/GeoCMS`
4. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend-nextjs`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. 点击 "Deploy"

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量（可选）：

```
NEXT_PUBLIC_APP_NAME=GeoCMS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 其他部署平台

### Netlify

1. 在项目根目录创建 `netlify.toml`：

```toml
[build]
  base = "frontend-nextjs"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. 连接 GitHub 仓库并部署

### Docker 部署

1. 创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. 构建和运行：

```bash
docker build -t geocms-frontend .
docker run -p 3000:3000 geocms-frontend
```

## 性能优化

### 1. 启用压缩

Vercel 自动启用 gzip 压缩，无需额外配置。

### 2. 图片优化

使用 Next.js Image 组件：

```tsx
import Image from 'next/image'

<Image src="/logo.png" alt="Logo" width={200} height={50} />
```

### 3. 代码分割

Next.js 自动进行代码分割，每个页面只加载必要的代码。

### 4. 缓存策略

在 `next.config.js` 中配置：

```js
module.exports = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## 监控和分析

### Vercel Analytics

在 Vercel 项目设置中启用 Analytics 功能。

### 自定义监控

集成 Google Analytics 或其他监控工具：

```tsx
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 故障排查

### 构建失败

1. 检查 Node.js 版本（需要 18+）
2. 清除缓存：`rm -rf .next node_modules && npm install`
3. 检查 TypeScript 错误：`npm run type-check`

### 运行时错误

1. 检查浏览器控制台
2. 查看 Vercel 部署日志
3. 启用详细日志：`DEBUG=* npm run dev`

## 回滚

### Vercel

在 Vercel Dashboard 中选择之前的部署版本，点击 "Promote to Production"。

### 手动回滚

```bash
git revert <commit-hash>
git push origin feature/nextjs-frontend
```

## 安全建议

1. 不要在代码中硬编码敏感信息
2. 使用环境变量存储配置
3. 启用 HTTPS（Vercel 自动提供）
4. 定期更新依赖：`npm audit fix`
5. 配置 CSP 头部

## 下一步

- [ ] 配置自定义域名
- [ ] 启用 Vercel Analytics
- [ ] 设置 CI/CD 流程
- [ ] 配置错误监控（Sentry）
- [ ] 性能监控（Web Vitals）

