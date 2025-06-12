# 系统架构

## 概述

GeoCMS 是一个基于 LLM 的智能内容生成系统，采用微服务架构设计，专注于将用户的自然语言提示词转换为结构化的内容输出。

## 技术栈

| 组件 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 后端框架 | FastAPI | 0.115.12 | 高性能异步 Web 框架 |
| 数据库 | SQLite | 3.x | 轻量级关系数据库（PoC阶段） |
| AI 框架 | LangChain | 0.1.9 | LLM 应用开发框架 |
| LLM 服务 | OpenAI API | 1.12.0 | 大语言模型服务 |
| 前端框架 | Streamlit | 1.31.1 | 快速原型开发框架 |
| 数据验证 | Pydantic | 2.6.1 | 数据模型和验证 |
| 测试框架 | pytest | 7.4.0 | 单元测试和集成测试 |

## 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Streamlit     │    │   FastAPI       │    │   SQLite        │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│                 │    │                 │    │                 │
│ - 用户界面      │    │ - API 路由      │    │ - 数据持久化    │
│ - 内容预览      │    │ - 请求处理      │    │ - 关系管理      │
│ - 交互控制      │    │ - 错误处理      │    │ - 事务支持      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI Agents     │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │  Planner    │ │
                       │ │  Agent      │ │
                       │ └─────────────┘ │
                       │ ┌─────────────┐ │
                       │ │  Writer     │ │
                       │ │  Agent      │ │
                       │ └─────────────┘ │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   LangChain     │
                       │   + OpenAI      │
                       │                 │
                       │ - LLM 调用      │
                       │ - 提示工程      │
                       │ - 结果处理      │
                       └─────────────────┘
```

## 核心模块

### 1. API 层 (`app/api/`)
- **职责**: 处理 HTTP 请求，提供 RESTful API
- **主要组件**:
  - `run_prompt.py`: 核心提示词处理端点
- **功能**:
  - 请求验证和参数解析
  - 业务逻辑调用
  - 响应格式化和错误处理
  - 日志记录和监控

### 2. AI 代理层 (`app/agents/`)
- **职责**: 智能内容分析和生成
- **主要组件**:
  - `planner.py`: 提示词分析和任务规划
  - `writer.py`: 内容生成和格式化
- **功能**:
  - 提示词语义分析
  - 内容类型识别
  - 结构化内容生成
  - Mock 数据回退机制

### 3. 数据层 (`app/models.py`, `app/db.py`)
- **职责**: 数据模型定义和持久化
- **主要组件**:
  - `models.py`: SQLAlchemy 数据模型
  - `db.py`: 数据库连接和会话管理
- **功能**:
  - 提示词存储 (`AgentPrompt`)
  - 内容块存储 (`ContentBlock`)
  - 关系映射和约束
  - 事务管理

### 4. 前端层 (`frontend/`)
- **职责**: 用户界面和交互
- **主要组件**:
  - `streamlit_app.py`: Web 应用界面
- **功能**:
  - 提示词输入界面
  - 内容预览和渲染
  - API 状态监控
  - 响应结果展示

## 核心流程

### 1. 请求处理流程
```
用户输入 → API 验证 → 数据库保存 → AI 处理 → 结果返回
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼
Streamlit   FastAPI    AgentPrompt   Planner    ContentBlock
   UI      run_prompt     Table      Agent        Table
```

### 2. AI 内容生成流程
```
1. Planner Agent 分析
   ├── 提示词语义理解
   ├── 内容类型识别 (article/webpage/business)
   ├── 结构需求分析 (title/headings/paragraphs/faqs)
   └── 内容长度估算 (short/medium/long)

2. Writer Agent 生成
   ├── 检查 OpenAI API 可用性
   ├── 构建增强提示词
   ├── LLM 调用 / Mock 数据回退
   └── 结构化内容输出
```

### 3. 数据持久化流程
```
AgentPrompt (1) ──────── (N) ContentBlock
     │                        │
     ├── id (自增主键)         ├── id (自增主键)
     ├── prompt_text          ├── prompt_id (外键)
     ├── created_at           ├── content (JSON)
     └── content_blocks[]     ├── block_type
                              └── created_at
```

## 数据模型

### AgentPrompt
```python
class AgentPrompt(Base):
    __tablename__ = "agent_prompts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=timezone.utc)
    content_blocks = relationship("ContentBlock", back_populates="prompt")
```

### ContentBlock
```python
class ContentBlock(Base):
    __tablename__ = "content_blocks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_id = Column(Integer, ForeignKey("agent_prompts.id"))
    content = Column(Text, nullable=False)  # JSON 格式
    block_type = Column(String(50), default="text")
    created_at = Column(DateTime, default=timezone.utc)
    prompt = relationship("AgentPrompt", back_populates="content_blocks")
```

## 配置管理

### 环境变量
- `OPENAI_API_KEY`: OpenAI API 密钥（可选，无密钥时使用 Mock 数据）
- `ENVIRONMENT`: 运行环境标识

### 依赖管理
- `requirements.txt`: 生产环境依赖
- `requirements-dev.txt`: 开发环境依赖

## 错误处理策略

1. **API 层**: HTTP 状态码 + 结构化错误响应
2. **业务层**: 异常捕获 + 日志记录
3. **AI 层**: LLM 调用失败时自动回退到 Mock 数据
4. **数据层**: 事务回滚 + 约束验证

## 测试策略

- **单元测试**: 覆盖所有核心模块 (93% 覆盖率)
- **集成测试**: 端到端流程验证
- **Mock 测试**: AI 服务不可用时的回退机制
- **API 测试**: 接口功能和错误处理

## 部署架构

### 当前 (PoC)
```
本地开发环境
├── SQLite 数据库
├── FastAPI 开发服务器
└── Streamlit 前端
```

### 规划 (生产)
```
云部署环境
├── PostgreSQL 数据库
├── Docker 容器化
├── React/Next.js 前端
└── CI/CD 自动化
```