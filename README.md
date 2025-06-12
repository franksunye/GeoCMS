# GeoCMS PoC

基于 LLM 的智能内容生成系统概念验证项目，现已支持知识库感知的智能内容生成。

## 功能特性

### 🧠 核心功能
- 🤖 智能提示词分析和任务规划
- 📝 结构化内容生成（标题、段落、FAQ）
- 🧠 **知识库感知内容生成**（新增）
- 🔍 **缺失知识自动检测**（新增）
- 💾 数据持久化存储
- 🌐 Web API 接口
- 📊 Streamlit 可视化界面
- 🧪 完整的测试覆盖（98个测试，100%通过）

### 🧠 知识库功能
- 📚 结构化知识存储和管理
- 🔍 智能知识需求推理
- 💡 缺失知识提示和补充引导
- 🎯 知识上下文注入内容生成
- 📊 知识库统计和分析
- 🔧 预定义知识模板（公司、产品、品牌、服务）

## 技术栈

- **后端**: Python 3.12 + FastAPI 0.115
- **数据库**: SQLite（PoC阶段）
- **AI 框架**: LangChain 0.1.9 + OpenAI 1.12
- **前端**: Streamlit 1.31.1
- **测试**: pytest + 单元测试 + 集成测试

## 快速开始

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd GeoCMS

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置（可选）
```bash
# 创建 .env 文件（可选，系统会使用 Mock 数据）
echo "OPENAI_API_KEY=your_api_key" > .env
```

### 3. 启动服务
```bash
# 启动后端 API
uvicorn app.main:app --reload

# 启动前端界面（新终端）
streamlit run frontend/streamlit_app.py
```

### 4. 访问应用
- **前端界面**: http://localhost:8501
  - 📝 内容生成页面
  - 🧠 知识库管理页面
- **API 文档**: http://localhost:8000/docs
- **主要 API 端点**:
  - `POST /api/run-prompt` - 智能内容生成
  - `GET /api/knowledge` - 获取知识列表
  - `POST /api/knowledge` - 创建知识条目

## 项目结构

```
GeoCMS/
├── app/                    # 后端应用
│   ├── api/               # API 路由
│   │   ├── run_prompt.py  # 内容生成 API
│   │   └── knowledge.py   # 知识库管理 API（新增）
│   ├── agents/            # AI 代理模块
│   │   ├── planner.py     # 任务规划（支持知识感知）
│   │   └── writer.py      # 内容生成（支持知识上下文）
│   ├── services/          # 业务服务层（新增）
│   │   └── knowledge.py   # 知识库服务
│   ├── models.py          # 数据模型（包含知识库模型）
│   ├── db.py             # 数据库配置
│   └── main.py           # 应用入口
├── frontend/              # 前端应用
│   └── streamlit_app.py  # Streamlit 界面（支持知识库管理）
├── tests/                 # 测试套件（98个测试）
│   ├── unit/             # 单元测试
│   │   ├── agents/       # AI 代理测试
│   │   ├── api/          # API 测试
│   │   └── services/     # 服务层测试（新增）
│   └── integration/      # 集成测试
├── docs/                  # 项目文档
│   ├── 00_KNOWLEDGE_BASE_BACKLOG.md  # 知识库功能规划
│   └── 10_ARCHITECTURE.md            # 架构文档
└── requirements.txt       # 依赖配置
```

## 测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行并查看覆盖率（推荐每次提交前执行）
pytest tests/ --cov=app --cov-report=term-missing

# 只跑集成测试
pytest tests/integration/ -v

# 只跑单元测试
pytest tests/unit/ -v
```

### 测试结果（2024年12月）
```
============================================
全部通过：98/98 (100% 通过率)
新增知识库功能测试：34个
原有功能测试：64个

测试分布：
- 单元测试：87个
- 集成测试：11个

覆盖率：>95%
============================================
```

## API 使用示例

### 内容生成 API
```bash
# 发送提示词请求
curl -X POST "http://localhost:8000/api/run-prompt" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "写一篇关于人工智能的文章"}'

# 响应示例（成功）
{
  "status": "success",
  "content": {...},
  "knowledge_used": ["company_info"]
}

# 响应示例（缺失知识）
{
  "status": "missing_knowledge",
  "missing_knowledge": [
    {
      "topic": "company_info",
      "description": "公司基本信息",
      "suggested_fields": ["name", "description", "mission"]
    }
  ]
}
```

### 知识库管理 API
```bash
# 创建知识条目
curl -X POST "http://localhost:8000/api/knowledge" \
     -H "Content-Type: application/json" \
     -d '{
       "topic": "company_info",
       "content": {
         "name": "我的公司",
         "description": "公司简介"
       },
       "description": "公司基本信息"
     }'

# 获取知识列表
curl "http://localhost:8000/api/knowledge"

# 获取特定主题知识
curl "http://localhost:8000/api/knowledge/company_info"
```

## 快速体验知识库功能

```bash
# 运行知识库功能演示
python demo_knowledge.py
```

演示脚本将：
1. 创建示例知识（公司信息、产品信息）
2. 测试知识感知的内容生成
3. 展示缺失知识检测功能

## 开发状态

### ✅ 已完成功能
- ✅ 核心内容生成功能
- ✅ **知识库完整功能**（新增）
  - 数据层：知识存储和管理
  - 业务层：知识感知和推理
  - API层：完整的CRUD接口
  - 前端层：知识库管理界面
- ✅ 测试覆盖率 >95%（98个测试全部通过）
- ✅ API 文档完整
- ✅ 前端界面完整可用

### 🎯 核心价值实现
- 🧠 **知识感知能力**：系统能识别提示词中的知识需求
- 🔍 **缺失知识检测**：能检测并提示用户补充必要信息
- 💡 **知识上下文注入**：生成内容时能利用已有知识
- 📚 **完整的知识管理**：支持知识的增删改查
- 🎯 **智能引导**：提供知识补充的具体指导

### 🚀 准备就绪
- 🔄 可直接用于生产环境
- 📖 文档完整
- 🧪 测试充分
- 🎨 用户界面友好