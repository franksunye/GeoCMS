# 开发指南

## PoC 阶段开发规范

### 环境设置
1. 开发环境要求
   - Python 3.8+
   - SQLite
   - OpenAI API 密钥
   - LangChain 依赖
   - Streamlit

2. 项目初始化
   ```bash
   # 创建虚拟环境
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或
   .\venv\Scripts\activate  # Windows

   # 安装依赖
   pip install -r requirements.txt

   # 启动开发服务器
   uvicorn app.main:app --reload
   ```

3. 配置文件
   ```python
   # .env
   OPENAI_API_KEY=your_api_key
   ENVIRONMENT=development
   ```

### 开发流程
1. 分支管理
   - main: 主分支
   - develop: 开发分支
   - feature/*: 功能分支

2. 提交规范
   ```
   feat: 新功能
   fix: 修复
   docs: 文档
   style: 格式
   refactor: 重构
   test: 测试
   chore: 构建
   ```

### 代码规范
1. 后端（Python + FastAPI）
   - 使用类型注解
   - 遵循 PEP 8 规范
   - 使用 pydantic 模型验证
   - 实现错误处理中间件
   - 添加请求验证

2. 前端（Streamlit）
   - 组件化开发
   - 状态管理
   - 错误处理
   - 日志记录

### 测试要求
1. 单元测试（pytest）
   - API 接口测试
   - 数据库操作测试
   - LLM 调用测试

2. 集成测试
   - 端到端流程测试
   - 性能测试

### 文档要求
1. 代码注释
   - 函数说明
   - 参数说明
   - 返回值说明

2. API 文档
   - FastAPI 自动生成的 Swagger 文档
   - 接口说明
   - 请求/响应示例
   - 错误码说明

### 日志规范
1. 应用日志
   - 使用 FastAPI 内置日志
   - 记录请求/响应信息
   - 记录错误和异常

2. Agent 日志
   - 使用 LangChain tracer
   - 记录 Prompt-Response 流程
   - 监控性能指标

## 后续开发规划
- 迁移到 PostgreSQL
- 集成向量存储
- 迁移到 React/Next.js
- 部署到 Vercel
- 完整的 CI/CD 流程
- 自动化测试
- 性能优化
- 安全加固 