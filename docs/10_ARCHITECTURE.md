# 系统架构

## 概述

GeoCMS 是一个基于 LLM 的智能内容生成系统，采用微服务架构设计，专注于将用户的自然语言提示词转换为结构化的内容输出。现已集成知识库感知功能，实现智能化的知识驱动内容生成。

**🚀 AI Native 升级中**：正在升级为多Agent协同的状态驱动系统，支持动态流程控制和智能会话管理。

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

### 当前架构（知识库感知版本）
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Streamlit     │    │   FastAPI       │    │   SQLite        │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│                 │    │                 │    │                 │
│ - 内容生成界面  │    │ - API 路由      │    │ - 数据持久化    │
│ - 知识库管理    │    │ - 请求处理      │    │ - 关系管理      │
│ - 内容预览      │    │ - 错误处理      │    │ - 事务支持      │
│ - 交互控制      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │   AI Agents     │               │
                       │                 │               │
                       │ ┌─────────────┐ │               │
                       │ │  Planner    │ │◄──────────────┤
                       │ │  Agent      │ │  知识感知      │
                       │ │ (知识感知)  │ │               │
                       │ └─────────────┘ │               │
                       │ ┌─────────────┐ │               │
                       │ │  Writer     │ │               │
                       │ │  Agent      │ │               │
                       │ │ (上下文注入)│ │               │
                       │ └─────────────┘ │               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │ Knowledge Base  │◄──────────────┘
                       │   Service       │
                       │                 │
                       │ - 知识存储      │
                       │ - 需求推理      │
                       │ - 上下文匹配    │
                       │ - 模板管理      │
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

### 目标架构（AI Native多Agent系统）
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Streamlit     │    │   FastAPI       │    │   SQLite        │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│                 │    │                 │    │                 │
│ - 状态驱动界面  │    │ - /next_action  │    │ - PlannerRuns   │
│ - 动态槽位询问  │    │ - 会话管理      │    │ - PlannerTasks  │
│ - 多轮对话      │    │ - 状态追踪      │    │ - KnowledgeBase │
│ - 任务进度      │    │                 │    │ - VerifierLogs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │ Agent Coordinator│               │
                       │                 │               │
                       │ ┌─────────────┐ │               │
                       │ │  Planner    │ │◄──────────────┤
                       │ │  Agent      │ │  状态驱动      │
                       │ │(状态驱动)   │ │               │
                       │ └─────────────┘ │               │
                       │ ┌─────────────┐ │               │
                       │ │  Writer     │ │               │
                       │ │  Agent      │ │               │
                       │ │(知识增强)   │ │               │
                       │ └─────────────┘ │               │
                       │ ┌─────────────┐ │               │
                       │ │ Verifier    │ │               │
                       │ │  Agent      │ │               │
                       │ │(质量校验)   │ │               │
                       │ └─────────────┘ │               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │ System Prompts  │               │
                       │   Management    │               │
                       │                 │               │
                       │ - prompts/      │               │
                       │ - 版本控制      │               │
                       │ - 模板管理      │               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │ Knowledge Base  │◄──────────────┘
                       │   Service       │
                       │                 │
                       │ - 知识存储      │
                       │ - 需求推理      │
                       │ - 上下文匹配    │
                       │ - 模板管理      │
                       └─────────────────┘
```

## 核心模块

### 1. API 层 (`app/api/`)
- **职责**: 处理 HTTP 请求，提供 RESTful API
- **主要组件**:
  - `run_prompt.py`: 核心提示词处理端点
  - `knowledge.py`: 知识库管理端点（新增）
- **功能**:
  - 请求验证和参数解析
  - 业务逻辑调用
  - 响应格式化和错误处理
  - 日志记录和监控
  - 知识库CRUD操作（新增）

### 2. AI 代理层 (`app/agents/`)
- **职责**: 智能内容分析和生成
- **主要组件**:
  - `planner.py`: 提示词分析和任务规划（支持知识感知）
  - `writer.py`: 内容生成和格式化（支持知识上下文）
- **功能**:
  - 提示词语义分析
  - 内容类型识别
  - **知识需求推理**（新增）
  - **知识上下文注入**（新增）
  - 结构化内容生成
  - Mock 数据回退机制

### 3. 服务层 (`app/services/`)
- **职责**: 业务逻辑处理和知识管理
- **主要组件**:
  - `knowledge.py`: 知识库服务（新增）
- **功能**:
  - 知识存储和检索
  - 知识需求推理
  - 知识模板管理
  - 知识搜索和匹配

### 4. 数据层 (`app/models.py`, `app/db.py`)
- **职责**: 数据模型定义和持久化
- **主要组件**:
  - `models.py`: SQLAlchemy 数据模型
  - `db.py`: 数据库连接和会话管理
- **功能**:
  - 提示词存储 (`AgentPrompt`)
  - 内容块存储 (`ContentBlock`)
  - **知识库存储** (`KnowledgeBase`)（新增）
  - 关系映射和约束
  - 事务管理

### 5. 前端层 (`frontend/`)
- **职责**: 用户界面和交互
- **主要组件**:
  - `streamlit_app.py`: Web 应用界面（支持知识库管理）
- **功能**:
  - 提示词输入界面
  - **知识库管理界面**（新增）
  - **缺失知识提示**（新增）
  - 内容预览和渲染
  - API 状态监控
  - 响应结果展示

## 核心流程

### 1. 知识感知内容生成流程（新增）
```
用户输入 → 知识需求分析 → 知识检索 → 内容生成 → 结果返回
    │           │             │           │           │
    ▼           ▼             ▼           ▼           ▼
Streamlit   Planner      Knowledge    Writer    ContentBlock
   UI       Agent        Service      Agent       Table
                            │
                            ▼
                      KnowledgeBase
                         Table
```

### 2. 传统请求处理流程
```
用户输入 → API 验证 → 数据库保存 → AI 处理 → 结果返回
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼
Streamlit   FastAPI    AgentPrompt   Planner    ContentBlock
   UI      run_prompt     Table      Agent        Table
```

### 3. 知识感知AI内容生成流程（增强版）
```
1. Planner Agent 分析（知识感知）
   ├── 提示词语义理解
   ├── 内容类型识别 (article/webpage/business)
   ├── 结构需求分析 (title/headings/paragraphs/faqs)
   ├── 内容长度估算 (short/medium/long)
   ├── **知识需求推理** (company_info/product_info/brand_info/service_info)
   └── **知识库查询和匹配**

2. 知识检索和验证
   ├── 根据推理结果查询知识库
   ├── 检测缺失的必要知识
   ├── 返回缺失知识提示 OR 可用知识上下文
   └── 构建知识上下文字典

3. Writer Agent 生成（上下文增强）
   ├── 检查 OpenAI API 可用性
   ├── **注入知识上下文到提示词**
   ├── 构建增强提示词
   ├── LLM 调用 / Mock 数据回退
   ├── **使用知识增强内容**
   └── 结构化内容输出 + 知识来源标记
```

### 4. 数据持久化流程（AI Native扩展版）
```
PlannerRuns (1) ──────── (N) PlannerTasks
     │                        │
     ├── id (自增主键)         ├── id (自增主键)
     ├── user_intent          ├── run_id (外键)
     ├── state (JSON)         ├── task_type
     ├── status               ├── task_data (JSON)
     ├── created_at           ├── result (JSON)
     └── updated_at           ├── status
                              ├── created_at
                              └── updated_at

AgentPrompt (1) ──────── (N) ContentBlock
     │                        │
     ├── id (自增主键)         ├── id (自增主键)
     ├── prompt_text          ├── prompt_id (外键)
     ├── created_at           ├── content (JSON)
     └── content_blocks[]     ├── block_type
                              └── created_at

ContentBlock (1) ──────── (N) VerifierLogs (可选)
     │                        │
     │                        ├── id (自增主键)
     │                        ├── content_block_id (外键)
     │                        ├── verification_result (JSON)
     │                        ├── issues_found (JSON)
     │                        ├── suggestions (JSON)
     │                        └── created_at

KnowledgeBase (独立表)
     │
     ├── id (自增主键)
     ├── topic (主题，索引)
     ├── content (JSON格式知识)
     ├── description (描述)
     ├── created_at
     └── updated_at
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

### KnowledgeBase（已实现）
```python
class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)  # JSON 格式存储
    description = Column(Text)
    created_at = Column(DateTime, default=timezone.utc)
    updated_at = Column(DateTime, default=timezone.utc)
```

### PlannerRuns（AI Native新增）
```python
class PlannerRuns(Base):
    __tablename__ = "planner_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_intent = Column(Text, nullable=False)
    state = Column(Text, nullable=False)  # JSON 格式存储状态槽位
    status = Column(String(50), default="active")  # active/completed/failed
    created_at = Column(DateTime, default=timezone.utc)
    updated_at = Column(DateTime, default=timezone.utc)
    tasks = relationship("PlannerTasks", back_populates="run")
```

### PlannerTasks（AI Native新增）
```python
class PlannerTasks(Base):
    __tablename__ = "planner_tasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("planner_runs.id"))
    task_type = Column(String(50), nullable=False)  # ask_slot/generate_content/verify
    task_data = Column(Text, nullable=False)  # JSON 格式存储任务数据
    result = Column(Text)  # JSON 格式存储任务结果
    status = Column(String(50), default="pending")  # pending/completed/failed
    created_at = Column(DateTime, default=timezone.utc)
    updated_at = Column(DateTime, default=timezone.utc)
    run = relationship("PlannerRuns", back_populates="tasks")
```

### VerifierLogs（AI Native可选）
```python
class VerifierLogs(Base):
    __tablename__ = "verifier_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    content_block_id = Column(Integer, ForeignKey("content_blocks.id"))
    verification_result = Column(Text, nullable=False)  # JSON 格式存储校验结果
    issues_found = Column(Text)  # JSON 格式存储发现的问题
    suggestions = Column(Text)  # JSON 格式存储改进建议
    created_at = Column(DateTime, default=timezone.utc)
    content_block = relationship("ContentBlock")
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

- **单元测试**: 覆盖所有核心模块 (>95% 覆盖率)
  - 知识库服务测试：18个测试
  - 知识库API测试：11个测试
  - 知识感知Planner测试：5个测试
- **集成测试**: 端到端流程验证（11个测试）
- **Mock 测试**: AI 服务不可用时的回退机制
- **API 测试**: 接口功能和错误处理
- **知识库功能测试**: 完整的知识管理流程测试（新增）

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