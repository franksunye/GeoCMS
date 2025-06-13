# 变更日志

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.0.0] - 2024-12-13 🚀 AI Native 多Agent系统升级 (后台完成)

### 🎯 重大升级 - AI Native架构 (后台已完成)
- ✅ **状态驱动流程控制**：Planner Agent决定下一步行动
- ✅ **多Agent协同机制**：Planner → Writer → Verifier完整闭环
- ✅ **会话状态管理**：基于PlannerRuns的状态追踪
- ✅ **System Prompt管理**：代码库中的提示词版本控制
- ✅ **动态槽位询问**：智能识别并询问缺失信息

### 🏗 新增数据模型 (已完成)
- ✅ **PlannerRuns**：会话状态和用户意图管理
- ✅ **PlannerTasks**：任务分解和执行追踪
- ✅ **VerifierLogs**：内容质量校验记录（可选）

### 🔧 架构增强 (已完成)
- ✅ 新增 `/api/ai-native/*` 状态驱动API套件
- ✅ Agent协调器和工作流引擎
- ✅ `prompts/` 目录的System Prompt管理
- ✅ 多轮对话和会话历史功能
- ✅ 状态管理和任务追踪服务

### 📊 开发进度
- ✅ **Phase 1**: 数据模型扩展 (PlannerRuns, PlannerTasks, VerifierLogs)
- ✅ **Phase 2**: System Prompt管理 (prompts/目录和管理服务)
- ✅ **Phase 3**: 状态驱动Planner升级 (状态管理和AI Native功能)
- ✅ **Phase 4**: 多Agent协同机制 (Agent协调器和工作流引擎)
- ✅ **Phase 5**: API层升级 (AI Native API端点)
- 🔄 **Phase 6**: 前端界面升级 (进行中)
- 🔄 **Phase 7**: 测试和文档 (进行中)

### 📈 测试覆盖
- ✅ **193个测试全部通过** (新增74个AI Native相关测试)
- ✅ 单元测试：数据模型、服务层、Agent协调器
- ✅ 集成测试：完整AI Native对话流程
- ✅ 向后兼容性：传统API继续正常工作
- ✅ Mock功能：无OpenAI Key时使用Mock数据

## [1.0.0] - 2024-12-12 🎉 知识库功能里程碑

### 🧠 重大新增 - 知识库感知功能
- ✅ **完整的知识库系统**：数据层、业务层、API层、前端层
- ✅ **智能知识感知**：自动识别提示词中的知识需求
- ✅ **缺失知识检测**：检测并引导用户补充必要信息
- ✅ **知识上下文注入**：生成内容时融合相关知识
- ✅ **知识库管理界面**：完整的CRUD操作和统计分析
- ✅ **预定义知识模板**：公司、产品、品牌、服务四大类型

### 🔧 技术增强
- ✅ 新增 `KnowledgeBase` 数据模型
- ✅ 新增 `app/services/knowledge.py` 业务服务层
- ✅ 新增 `app/api/knowledge.py` 知识管理API
- ✅ 扩展 Planner Agent 支持知识感知
- ✅ 扩展 Writer Agent 支持知识上下文
- ✅ 扩展 Streamlit 前端支持知识库管理

### 📊 测试和质量
- ✅ **98个测试全部通过**（新增34个知识库相关测试）
- ✅ 测试覆盖率 >95%
- ✅ 完整的集成测试和单元测试

### 📖 文档完善
- ✅ 更新架构文档和README
- ✅ 新增知识库使用指南
- ✅ 提供完整的API示例和演示脚本

## [0.1.0] - 2024-06-12

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