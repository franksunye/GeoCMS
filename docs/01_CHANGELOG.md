# 变更日志

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2025-06-12

### 新增
- ✅ 完整的 FastAPI 后端架构
- ✅ SQLite 数据库集成和模型定义
- ✅ AI Agent 模块 (Planner + Writer)
- ✅ LangChain + OpenAI 集成
- ✅ Streamlit 前端界面
- ✅ 完整的测试套件 (45 个测试，93% 覆盖率)
- ✅ Mock 数据回退机制
- ✅ API 文档和错误处理

### 核心功能
- 🤖 智能提示词分析和任务规划
- 📝 结构化内容生成 (标题、段落、FAQ)
- 💾 数据持久化存储
- 🌐 RESTful API 接口
- 📊 可视化前端界面

### 技术实现
- FastAPI 0.115.12 + SQLAlchemy 2.0.23
- LangChain 0.1.9 + OpenAI 1.12.0
- Streamlit 1.31.1 前端
- pytest 测试框架
- 自动化 ID 生成和时区感知时间戳

### 修复
- 🔧 数据库模型 autoincrement 配置
- 🔧 时间戳弃用警告修复
- 🔧 测试 Mock 配置优化
- 🔧 集成测试期望值修正