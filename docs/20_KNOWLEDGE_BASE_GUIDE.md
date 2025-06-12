# 知识库功能使用指南

## 概述

GeoCMS 知识库功能为系统提供了智能化的知识感知能力，能够：
- 🧠 自动识别内容生成中的知识需求
- 🔍 检测缺失的必要知识信息
- 💡 引导用户补充相关知识
- 🎯 在内容生成时注入相关知识上下文

## 核心概念

### 知识主题 (Topic)
知识按主题分类存储，系统预定义了四种主要类型：
- `company_info`: 公司基本信息
- `product_info`: 产品详细信息  
- `brand_info`: 品牌相关信息
- `service_info`: 服务相关信息

### 知识内容 (Content)
以JSON格式存储的结构化数据，包含该主题的具体信息字段。

### 知识模板 (Template)
为每种知识类型预定义的字段结构，帮助用户规范化地创建知识。

## 快速开始

### 1. 启动系统
```bash
# 启动后端
uvicorn app.main:app --reload

# 启动前端
streamlit run frontend/streamlit_app.py
```

### 2. 访问知识库管理
- 打开前端界面：http://localhost:8501
- 在侧边栏选择"🧠 知识库管理"

### 3. 创建第一个知识条目
1. 切换到"➕ 添加知识"标签页
2. 选择知识类型（如 company_info）
3. 填写相应字段
4. 点击"💾 保存知识"

## 使用场景

### 场景1：公司介绍页面生成

**步骤1：创建公司信息知识**
```json
{
  "topic": "company_info",
  "content": {
    "name": "GeoCMS科技有限公司",
    "description": "专注于AI驱动的智能建站系统开发",
    "mission": "让每个人都能轻松创建专业网站",
    "vision": "成为全球领先的智能建站平台",
    "founded": "2024年",
    "location": "北京市海淀区"
  },
  "description": "公司基本信息"
}
```

**步骤2：生成内容**
- 提示词：`"为我们公司创建一个介绍页面"`
- 系统会自动识别需要公司信息
- 使用已有知识生成个性化内容

### 场景2：产品宣传文案生成

**步骤1：创建产品信息知识**
```json
{
  "topic": "product_info", 
  "content": {
    "name": "GeoCMS智能建站系统",
    "description": "基于大语言模型的智能内容生成与管理系统",
    "features": [
      "AI驱动的内容生成",
      "知识库感知",
      "多种内容类型支持"
    ],
    "benefits": [
      "提高内容创作效率",
      "确保内容一致性",
      "降低技术门槛"
    ],
    "target_audience": "中小企业、个人创业者",
    "pricing": "基础版免费，专业版99元/月"
  },
  "description": "产品详细信息"
}
```

**步骤2：生成内容**
- 提示词：`"写一篇关于我们产品的宣传文案"`
- 系统自动使用产品知识
- 生成针对性的宣传内容

### 场景3：缺失知识检测

**情况：**用户输入`"为我们公司创建介绍页面"`，但系统中没有公司信息

**系统响应：**
```json
{
  "status": "missing_knowledge",
  "missing_knowledge": [
    {
      "topic": "company_info",
      "description": "公司基本信息", 
      "suggested_fields": ["name", "description", "mission", "vision"]
    }
  ]
}
```

**用户操作：**
1. 系统显示缺失知识提示
2. 点击"➕ 添加 company_info"按钮
3. 自动跳转到知识管理页面
4. 填写公司信息后重新生成

## API 使用

### 知识管理 API

#### 创建知识
```bash
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
```

#### 获取知识列表
```bash
curl "http://localhost:8000/api/knowledge"
```

#### 获取特定知识
```bash
curl "http://localhost:8000/api/knowledge/company_info"
```

#### 更新知识
```bash
curl -X PUT "http://localhost:8000/api/knowledge/1" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "name": "更新后的公司名称"
    }
  }'
```

#### 删除知识
```bash
curl -X DELETE "http://localhost:8000/api/knowledge/1"
```

### 内容生成 API

#### 智能内容生成
```bash
curl -X POST "http://localhost:8000/api/run-prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "为我们公司创建介绍页面"}'
```

**成功响应（有知识）：**
```json
{
  "status": "success",
  "content": {...},
  "knowledge_used": ["company_info"]
}
```

**缺失知识响应：**
```json
{
  "status": "missing_knowledge", 
  "missing_knowledge": [
    {
      "topic": "company_info",
      "description": "公司基本信息",
      "suggested_fields": ["name", "description"]
    }
  ]
}
```

## 知识模板参考

### company_info 模板
```json
{
  "name": "公司名称",
  "description": "公司简介", 
  "mission": "公司使命",
  "vision": "公司愿景",
  "founded": "成立时间",
  "location": "公司地址"
}
```

### product_info 模板
```json
{
  "name": "产品名称",
  "description": "产品描述",
  "features": ["特性1", "特性2"],
  "benefits": ["优势1", "优势2"], 
  "target_audience": "目标用户",
  "pricing": "价格信息"
}
```

### brand_info 模板
```json
{
  "name": "品牌名称",
  "slogan": "品牌口号",
  "values": ["价值观1", "价值观2"],
  "personality": "品牌个性",
  "tone": "品牌语调"
}
```

### service_info 模板
```json
{
  "name": "服务名称",
  "description": "服务描述", 
  "process": ["步骤1", "步骤2"],
  "benefits": ["优势1", "优势2"],
  "pricing": "价格信息"
}
```

## 最佳实践

### 1. 知识组织
- 按业务领域分类创建知识
- 保持知识内容的准确性和时效性
- 使用描述字段说明知识用途

### 2. 内容生成
- 使用具体明确的提示词
- 充分利用知识模板的预定义字段
- 定期更新知识内容

### 3. 知识维护
- 定期检查知识库统计信息
- 及时补充缺失的知识类型
- 保持知识内容的一致性

## 故障排除

### 问题1：知识未被使用
**可能原因：**
- 提示词与知识主题不匹配
- 知识内容格式错误

**解决方案：**
- 检查提示词是否包含相关关键词
- 验证知识内容的JSON格式

### 问题2：缺失知识检测不准确
**可能原因：**
- 知识推理逻辑需要优化
- 提示词表达不够明确

**解决方案：**
- 使用更具体的提示词
- 手动创建相关知识

### 问题3：前端界面异常
**可能原因：**
- API服务未启动
- 网络连接问题

**解决方案：**
- 检查后端服务状态
- 验证API连接配置

## 技术细节

### 知识推理算法
系统使用关键词匹配算法识别知识需求：
- 公司相关：公司、我们、企业等
- 产品相关：产品、服务、功能等
- 品牌相关：品牌、形象、价值等

### 知识注入机制
在内容生成时，系统会：
1. 将知识内容注入到LLM提示词中
2. 在Mock数据生成时替换占位符
3. 标记使用的知识来源

### 性能优化
- 知识查询使用数据库索引
- 支持知识内容缓存
- 异步处理知识推理

## 扩展功能

### 计划中的功能
- 向量化知识检索
- 知识图谱集成
- 自动知识提取
- 多语言知识支持
- 知识版本管理

### 自定义扩展
开发者可以：
- 添加新的知识类型
- 自定义知识推理规则
- 扩展知识模板字段
- 集成外部知识源
