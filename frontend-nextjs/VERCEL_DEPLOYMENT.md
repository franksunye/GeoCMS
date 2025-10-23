# Vercel 部署指南

## 🚀 快速部署（推荐方法）

### 方法一：通过 Vercel Dashboard + GitHub 集成

这是最简单、最推荐的方法，支持自动部署。

#### Step 1: 访问 Vercel

1. 打开浏览器，访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录（如果还没有账号，点击 "Sign Up" 注册）

#### Step 2: 导入项目

1. 登录后，点击右上角的 **"Add New..."** 按钮
2. 选择 **"Project"**
3. 在 "Import Git Repository" 页面，找到您的仓库 **`franksunye/GeoCMS`**
4. 点击 **"Import"** 按钮

#### Step 3: 配置项目（重要！）

在项目配置页面，您需要进行以下设置：

##### 1. Framework Preset
- 选择：**Next.js**

##### 2. Root Directory（关键配置）
- 点击 **"Edit"** 按钮
- 输入：**`frontend-nextjs`**
- 这是因为您的 Next.js 项目在子目录中

##### 3. Build and Output Settings
- **Build Command**: `npm run build`（自动检测）
- **Output Directory**: `.next`（自动检测）
- **Install Command**: `npm install`（自动检测）

##### 4. Environment Variables（可选）
暂时不需要添加环境变量，使用默认配置即可。

#### Step 4: 部署

1. 检查所有配置正确后，点击 **"Deploy"** 按钮
2. Vercel 会开始构建和部署您的项目
3. 等待 2-3 分钟，部署完成

#### Step 5: 查看部署结果

部署成功后，您会看到：
- ✅ 部署成功的提示
- 🔗 项目的 URL（例如：`https://geo-cms-xxx.vercel.app`）
- 📊 部署详情和日志

点击 URL 即可查看您的应用！

---

## 方法二：通过 Vercel CLI（命令行）

如果您更喜欢使用命令行，可以使用这个方法。

### Step 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### Step 2: 登录 Vercel

```bash
vercel login
```

按照提示完成登录（会打开浏览器）。

### Step 3: 部署项目

```bash
# 进入项目目录
cd frontend-nextjs

# 首次部署（会询问配置）
vercel

# 按照提示回答：
# ? Set up and deploy "~/frontend-nextjs"? [Y/n] Y
# ? Which scope do you want to deploy to? [选择您的账号]
# ? Link to existing project? [N/y] N
# ? What's your project's name? geocms-frontend
# ? In which directory is your code located? ./
```

### Step 4: 生产部署

预览部署成功后，执行生产部署：

```bash
vercel --prod
```

---

## 📋 配置说明

### vercel.json 文件

项目已包含 `vercel.json` 配置文件：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### 环境变量（可选）

如果需要配置环境变量，在 Vercel Dashboard 中：

1. 进入项目设置（Settings）
2. 选择 "Environment Variables"
3. 添加变量：
   - `NEXT_PUBLIC_APP_NAME`: GeoCMS
   - `NEXT_PUBLIC_APP_VERSION`: 1.0.0

---

## 🔄 自动部署

使用 GitHub 集成后，每次推送代码到 `feature/nextjs-frontend` 分支，Vercel 会自动：

1. 检测到代码变更
2. 自动构建
3. 自动部署
4. 生成预览 URL

### 分支部署策略

- **`master` 分支** → 生产环境（Production）
- **`feature/nextjs-frontend` 分支** → 预览环境（Preview）
- **其他分支** → 预览环境（Preview）

---

## 🌐 访问您的应用

部署成功后，您会获得：

### 1. 生产 URL
- 格式：`https://geocms-frontend.vercel.app`
- 或自定义域名

### 2. 预览 URL
- 格式：`https://geocms-frontend-git-feature-nextjs-frontend-franksunye.vercel.app`
- 每个分支和 PR 都有独立的预览 URL

### 3. 部署详情
- 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
- 查看所有部署记录
- 查看构建日志
- 查看性能指标

---

## 🛠️ 常见问题

### Q1: 构建失败怎么办？

**A**: 检查构建日志：
1. 在 Vercel Dashboard 中点击失败的部署
2. 查看 "Build Logs"
3. 根据错误信息修复问题
4. 推送代码，自动重新部署

### Q2: 如何查看部署日志？

**A**: 
1. 访问 Vercel Dashboard
2. 选择您的项目
3. 点击 "Deployments"
4. 选择任意部署记录
5. 查看详细日志

### Q3: 如何回滚到之前的版本？

**A**:
1. 在 Vercel Dashboard 中选择项目
2. 点击 "Deployments"
3. 找到要回滚的版本
4. 点击 "..." 菜单
5. 选择 "Promote to Production"

### Q4: 如何配置自定义域名？

**A**:
1. 在项目设置中选择 "Domains"
2. 点击 "Add"
3. 输入您的域名
4. 按照提示配置 DNS

### Q5: 部署后页面空白？

**A**: 检查：
1. 浏览器控制台是否有错误
2. API 路径是否正确
3. 环境变量是否配置

---

## 📊 性能优化

Vercel 自动提供：

- ✅ **全球 CDN** - 自动分发到全球节点
- ✅ **自动压缩** - Gzip/Brotli 压缩
- ✅ **图片优化** - Next.js Image 优化
- ✅ **边缘缓存** - 静态资源缓存
- ✅ **HTTPS** - 自动 SSL 证书

---

## 🔒 安全性

- ✅ 自动 HTTPS
- ✅ DDoS 防护
- ✅ 环境变量加密
- ✅ 安全头部配置

---

## 📈 监控和分析

### Vercel Analytics（可选）

1. 在项目设置中启用 "Analytics"
2. 查看：
   - 页面访问量
   - 性能指标
   - Web Vitals
   - 用户地理分布

### 集成第三方监控

可以集成：
- Google Analytics
- Sentry（错误监控）
- LogRocket（用户会话）

---

## 🎯 部署检查清单

部署前确认：

- [ ] 代码已推送到 GitHub
- [ ] 本地构建成功（`npm run build`）
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误
- [ ] vercel.json 配置正确
- [ ] Root Directory 设置为 `frontend-nextjs`

部署后验证：

- [ ] 首页正常加载
- [ ] 知识库页面正常
- [ ] 策划页面正常
- [ ] 草稿页面正常
- [ ] API 路由正常工作
- [ ] 无控制台错误

---

## 🚀 快速开始命令

```bash
# 方法一：通过 Dashboard
# 1. 访问 https://vercel.com
# 2. 导入 GitHub 仓库
# 3. 设置 Root Directory 为 frontend-nextjs
# 4. 点击 Deploy

# 方法二：通过 CLI
npm install -g vercel
cd frontend-nextjs
vercel login
vercel
vercel --prod
```

---

## 📞 获取帮助

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 部署**: https://nextjs.org/docs/deployment
- **Vercel 社区**: https://github.com/vercel/vercel/discussions

---

**祝您部署顺利！** 🎉

如有问题，请查看 Vercel Dashboard 中的构建日志。

