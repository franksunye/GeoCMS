# 系统架构

## PoC 阶段架构

### 概述
GeoCMS PoC 阶段专注于验证 LLM 驱动内容生成的核心流程，包括 Prompt 处理、内容生成和数据持久化。

### 技术栈
- 后端：Python + FastAPI 0.95.2
- 数据库：SQLite（PoC阶段）→ PostgreSQL（后续）
- AI 框架：LangChain 0.1.9 + OpenAI 1.12.0
- 前端：Streamlit 1.31.1
- 日志：FastAPI logging
- 配置：.env + pydantic 1.10.13
- 测试：pytest

### 系统组件
1. **Prompt 处理模块**
   - FastAPI 接口 `/api/run-prompt`
   - 请求验证和错误处理
   - 日志记录

2. **AI Agent 模块**
   - LangChain 框架集成
   - Planner：分析 Prompt 并拆解任务
   - Writer：生成结构化内容

3. **数据存储模块**
   - SQLite 数据库（PoC阶段）
   - agent_prompts 表：存储原始 Prompt
   - content_blocks 表：存储生成的内容快照
   - 预留 PostgreSQL 迁移接口

4. **前端展示模块**
   - Streamlit 应用
   - Prompt 输入界面
   - 内容预览渲染
   - JSON 数据展示

### 数据流
1. 用户通过 Streamlit 输入 Prompt
2. FastAPI 接收请求并记录日志
3. LangChain Agent 处理 Prompt
4. 系统保存 Prompt 到 SQLite
5. Writer 生成结构化内容
6. 系统保存内容到 SQLite
7. 返回结果给 Streamlit 展示

### 数据库设计
```sql
-- 保存 Prompt
CREATE TABLE agent_prompts (
    id UUID PRIMARY KEY,
    prompt_text TEXT,
    created_at TIMESTAMP
);

-- 保存生成内容快照
CREATE TABLE content_blocks (
    id UUID PRIMARY KEY,
    prompt_id UUID,
    content JSONB,
    version INT,
    created_at TIMESTAMP
);
```

### 项目结构
```
/app
  /api
    __init__.py
    run_prompt.py
  /agents
    __init__.py
    planner.py
    writer.py
  __init__.py
  db.py
  main.py
  models.py
/frontend
  streamlit_app.py
/docs
  *.md
requirements.txt
.env
.gitignore
README.md
```

## 后续架构规划
- 迁移到 PostgreSQL
- 集成向量存储（Milvus/PG vector）
- 迁移到 React/Next.js 前端
- 部署到 Vercel
- 完整的 UI/UX 设计

## 系统架构

## 技术栈

## 系统组件

## 数据流

## 部署架构 