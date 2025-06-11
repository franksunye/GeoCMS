# 项目待办事项

## PoC 阶段（2-3周）

### 第一周
- [ ] 数据库设计
  - [ ] 创建 agent_prompts 表
  - [ ] 创建 content_blocks 表
- [ ] 实现 POST /api/run-prompt 接口
  - [ ] 接收 Prompt 内容
  - [ ] 写入 agent_prompts 表

### 第二周
- [ ] 集成 LLM 调用流程
  - [ ] 实现 Planner 分析 Prompt
  - [ ] 实现 Writer 生成结构化内容
  - [ ] 集成 LangChain/CrewAI
  - [ ] 实现内容写入 content_blocks

### 第三周
- [ ] 前端开发
  - [ ] 创建简易 Prompt 输入界面
  - [ ] 实现 JSON 内容展示
  - [ ] 实现网页预览渲染
- [ ] 内部演示准备
  - [ ] 准备演示文档
  - [ ] 进行内部测试

## 后续规划
- [ ] MVP 阶段规划
  - [ ] 页面部署功能
  - [ ] RAG 检测机制
  - [ ] 版本控制
  - [ ] UI 完整设计

## 功能待办
- [ ] 待添加

## 技术债务
- [ ] 待添加

## 优化项
- [ ] 待添加 