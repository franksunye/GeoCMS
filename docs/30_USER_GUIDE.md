# GeoCMS AI Native 用户使用指南

## 🎯 概述

GeoCMS v0.3.0 是一个AI Native的智能建站系统，通过多轮对话和状态驱动的方式，帮助用户轻松创建专业的网站内容。

## 🚀 快速开始

### 1. 启动系统

```bash
# 启动后端API服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 启动前端界面
streamlit run frontend/streamlit_app.py --server.port 8501
```

### 2. 访问界面

- **前端界面**: http://localhost:8501
- **API文档**: http://localhost:8000/docs
- **AI Native API**: http://localhost:8000/api/ai-native/*

## 🤖 AI Native 对话功能

### 开始新对话

1. 在前端界面选择 "🤖 AI Native 对话"
2. 点击 "🆕 开始新对话"
3. 输入您的网站创建意图，例如：
   - "我想创建一个科技公司的企业官网"
   - "帮我做一个产品介绍页面"
   - "创建一个个人博客网站"

### 多轮对话流程

AI助手会通过多轮对话收集必要信息：

#### 第一轮：网站类型
- **问题**: "请告诉我您想创建什么类型的网站？"
- **选项**: 企业官网、产品介绍、个人博客、电商网站、服务展示
- **示例回答**: "企业官网"

#### 第二轮：品牌信息
- **问题**: "请告诉我您的品牌或公司名称"
- **示例回答**: "GeoCMS科技"

#### 第三轮：目标受众
- **问题**: "请描述您的目标用户群体"
- **选项**: 企业客户、个人用户、开发者、学生、专业人士
- **示例回答**: "中小企业主"

#### 第四轮：内容目标（可选）
- **问题**: "请告诉我您希望通过网站实现什么目标？"
- **选项**: 品牌展示、产品介绍、服务推广、信息分享、用户转化
- **示例回答**: "品牌展示"

### 内容生成

当收集到足够信息后，AI助手会：

1. **分析需求**: 根据您的回答分析内容需求
2. **检查知识**: 验证是否有足够的知识支持内容生成
3. **生成内容**: 创建结构化的网站内容
4. **展示结果**: 提供内容预览和网页预览

## 📚 知识库管理

### 添加知识

1. 切换到 "📚 知识库管理" 页面
2. 选择 "添加知识" 标签页
3. 选择知识类型或自定义主题
4. 填写知识内容
5. 点击 "保存知识"

### 知识类型

系统支持多种预定义知识类型：

#### 公司信息 (company_info)
```json
{
  "name": "公司名称",
  "description": "公司简介",
  "founded": "成立时间",
  "location": "公司地址",
  "mission": "公司使命",
  "vision": "公司愿景",
  "values": ["价值观1", "价值观2"],
  "employees": "员工数量",
  "industry": "所属行业"
}
```

#### 产品信息 (product_info)
```json
{
  "name": "产品名称",
  "description": "产品描述",
  "features": ["特性1", "特性2"],
  "benefits": ["优势1", "优势2"],
  "target_market": "目标市场",
  "pricing": "价格信息",
  "availability": "可用性"
}
```

#### 品牌信息 (brand_info)
```json
{
  "name": "品牌名称",
  "slogan": "品牌口号",
  "personality": "品牌个性",
  "tone": "品牌语调",
  "colors": ["主色调", "辅助色"],
  "fonts": ["主字体", "辅助字体"],
  "logo": "Logo描述"
}
```

### 知识使用

- **自动检测**: AI会自动检测内容生成所需的知识
- **智能匹配**: 根据用户意图匹配相关知识
- **缺失提醒**: 当缺少必要知识时，系统会提示用户补充

## 🔧 高级功能

### API 直接调用

#### 开始对话
```bash
curl -X POST "http://localhost:8000/api/ai-native/conversations" \
  -H "Content-Type: application/json" \
  -d '{"user_intent": "创建企业官网"}'
```

#### 处理用户输入
```bash
curl -X POST "http://localhost:8000/api/ai-native/conversations/123/input" \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "企业官网",
    "context": {"slot_name": "site_type"}
  }'
```

#### 生成内容
```bash
curl -X POST "http://localhost:8000/api/ai-native/conversations/123/generate" \
  -H "Content-Type: application/json" \
  -d '{"task_data": {"page_type": "homepage"}}'
```

### 工作流执行

#### 标准工作流
```bash
curl -X POST "http://localhost:8000/api/ai-native/conversations/123/workflow" \
  -H "Content-Type: application/json" \
  -d '{"workflow_type": "standard"}'
```

#### 带校验的工作流
```bash
curl -X POST "http://localhost:8000/api/ai-native/conversations/123/workflow" \
  -H "Content-Type: application/json" \
  -d '{"workflow_type": "with_verification"}'
```

## 🎨 内容预览

### 内容预览模式

生成的内容支持两种预览模式：

1. **结构化预览**: 显示标题、章节、段落等结构化内容
2. **网页预览**: 渲染为HTML格式，模拟真实网页效果

### 内容结构

生成的内容包含以下结构：

```json
{
  "title": "页面主标题",
  "headings": ["章节标题1", "章节标题2"],
  "paragraphs": ["段落内容1", "段落内容2"],
  "faqs": [
    {
      "question": "常见问题",
      "answer": "问题答案"
    }
  ],
  "cta": {
    "text": "行动号召文本",
    "action": "具体行动"
  },
  "knowledge_sources": ["使用的知识来源"]
}
```

## 🔍 故障排除

### 常见问题

#### 1. API服务无法连接
- **检查**: 确保后端服务正在运行 (http://localhost:8000)
- **解决**: 重新启动API服务

#### 2. 对话无响应
- **检查**: 查看API服务日志
- **解决**: 检查网络连接和服务状态

#### 3. 内容生成失败
- **原因**: 可能缺少必要的知识信息
- **解决**: 根据提示补充相关知识

#### 4. 知识库为空
- **解决**: 添加一些基础知识信息，如公司信息、产品信息等

### 性能优化

#### 1. 响应时间优化
- 确保数据库连接正常
- 检查系统资源使用情况
- 考虑使用缓存机制

#### 2. 并发处理
- 系统支持多用户并发使用
- 每个对话会话独立管理
- 建议同时在线用户不超过100个

## 📈 最佳实践

### 1. 知识库建设
- **完整性**: 确保知识信息完整准确
- **及时性**: 定期更新知识内容
- **结构化**: 使用标准的JSON格式

### 2. 对话交互
- **明确意图**: 清楚描述您的需求
- **详细回答**: 提供尽可能详细的信息
- **耐心等待**: AI处理需要一定时间

### 3. 内容优化
- **预览检查**: 仔细检查生成的内容
- **知识补充**: 根据需要补充相关知识
- **迭代改进**: 通过多次对话优化结果

## 🆕 版本更新

### v0.3.0 新功能
- ✅ AI Native多轮对话
- ✅ 状态驱动的流程控制
- ✅ 多Agent协同工作
- ✅ 智能槽位询问
- ✅ 工作流引擎
- ✅ 内容质量校验（可选）

### 向后兼容
- 传统的单轮生成API继续可用
- 现有的知识库功能完全保留
- 所有历史数据和配置保持不变

## 📞 技术支持

如果您在使用过程中遇到问题，请：

1. 查看本用户指南
2. 检查API文档 (http://localhost:8000/docs)
3. 查看系统日志
4. 联系技术支持团队

---

**GeoCMS v0.3.0** - AI Native 智能建站系统  
让每个人都能轻松创建专业网站！
