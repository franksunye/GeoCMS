# GeoCMS PoC

基于 LLM 的智能内容生成系统概念验证项目。

## 功能特性

- 🤖 智能提示词分析和任务规划
- 📝 结构化内容生成（标题、段落、FAQ）
- 💾 数据持久化存储
- 🌐 Web API 接口
- 📊 Streamlit 可视化界面
- 🧪 完整的测试覆盖（93%）

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
- **API 文档**: http://localhost:8000/docs
- **API 端点**: http://localhost:8000/run-prompt

## 项目结构

```
GeoCMS/
├── app/                    # 后端应用
│   ├── api/               # API 路由
│   ├── agents/            # AI 代理模块
│   ├── models.py          # 数据模型
│   ├── db.py             # 数据库配置
│   └── main.py           # 应用入口
├── frontend/              # 前端应用
│   └── streamlit_app.py  # Streamlit 界面
├── tests/                 # 测试套件
│   ├── unit/             # 单元测试
│   └── integration/      # 集成测试
├── docs/                  # 项目文档
└── requirements.txt       # 依赖配置
```

## 测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行测试并查看覆盖率
pytest tests/ --cov=app --cov-report=term-missing

# 运行特定测试
pytest tests/unit/api/ -v
```

## API 使用示例

```bash
# 发送提示词请求
curl -X POST "http://localhost:8000/run-prompt" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "写一篇关于人工智能的文章"}'
```

## 开发状态

- ✅ 核心功能完成
- ✅ 测试覆盖率 93%
- ✅ API 文档完整
- ✅ 前端界面可用
- 🔄 准备生产部署