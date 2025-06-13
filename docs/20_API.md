# API 文档

## 概述

GeoCMS 提供完整的 RESTful API，支持智能内容生成和知识库管理。现已升级为AI Native架构，支持状态驱动的多轮对话和Agent协同。

## API 版本

- **传统API**: `/api/*` - 向后兼容的单轮请求API
- **AI Native API**: `/api/ai-native/*` - 新的多轮对话和状态驱动API

## AI Native API (推荐)

### POST /api/ai-native/conversations

开始新的AI Native对话。

**请求体**
```json
{
    "user_intent": "我想创建一个企业官网"
}
```

**成功响应**
```json
{
    "status": "conversation_started",
    "run_id": 123,
    "next_action": {
        "action": "ask_slot",
        "slot_name": "site_type",
        "prompt": "请告诉我您想创建什么类型的网站？",
        "options": ["企业官网", "产品介绍", "个人博客"],
        "current_state": {...},
        "progress": 0.1
    }
}
```

### POST /api/ai-native/conversations/{run_id}/input

处理用户输入，推进对话。

**请求体**
```json
{
    "user_input": "企业官网",
    "context": {
        "slot_name": "site_type"
    }
}
```

**响应（继续询问）**
```json
{
    "action": "ask_slot",
    "data": {
        "action": "ask_slot",
        "slot_name": "brand_name",
        "prompt": "请告诉我您的品牌或公司名称",
        "progress": 0.4
    }
}
```

**响应（开始规划）**
```json
{
    "action": "plan",
    "data": {
        "action": "plan",
        "tasks": [
            {
                "type": "generate_content",
                "page_type": "homepage",
                "knowledge_required": ["company_info"]
            }
        ],
        "knowledge_context": {...}
    }
}
```

### GET /api/ai-native/conversations/{run_id}/status

获取对话状态和进度。

**响应**
```json
{
    "run_id": 123,
    "user_intent": "创建企业官网",
    "status": "active",
    "current_state": {
        "site_type": "企业官网",
        "brand_name": "GeoCMS科技",
        "target_audience": null
    },
    "progress": 0.6,
    "tasks": [
        {
            "id": 1,
            "type": "ask_slot",
            "status": "completed",
            "data": {...},
            "result": {...}
        }
    ]
}
```

### POST /api/ai-native/conversations/{run_id}/generate

生成内容。

**请求体**
```json
{
    "task_data": {
        "page_type": "homepage"
    }
}
```

**响应**
```json
{
    "action": "content_generated",
    "data": {
        "status": "content_generated",
        "content_block_id": 456,
        "content": {
            "title": "GeoCMS科技 - 智能建站专家",
            "headings": ["核心优势", "服务介绍"],
            "paragraphs": ["..."],
            "knowledge_sources": ["company_info"]
        },
        "knowledge_used": ["company_info"]
    }
}
```

### POST /api/ai-native/conversations/{run_id}/workflow

执行工作流。

**请求体**
```json
{
    "workflow_type": "standard"
}
```

**响应**
```json
{
    "action": "workflow_executed",
    "data": {
        "workflow": "standard",
        "results": [
            {
                "status": "content_generated",
                "content_block_id": 456
            }
        ]
    }
}
```

### GET /api/ai-native/health

健康检查。

**响应**
```json
{
    "status": "healthy",
    "service": "ai_native_api",
    "version": "1.0.0"
}
```

## 传统API (向后兼容)

### 内容生成 API

### POST /api/run-prompt

智能内容生成，支持知识感知和缺失知识检测。

**请求体**
```json
{
    "prompt": "string"  // 用户输入的 Prompt 文本
}
```

**成功响应（有知识支持）**
```json
{
    "status": "success",
    "id": 123,
    "prompt_id": 123,
    "content": {
        "title": "string",
        "headings": ["string"],
        "paragraphs": ["string"],
        "faqs": [
            {
                "question": "string",
                "answer": "string"
            }
        ],
        "knowledge_sources": ["company_info", "product_info"]
    },
    "content_type": "structured",
    "knowledge_used": ["company_info", "product_info"],
    "created_at": "2024-12-12T10:00:00Z"
}
```

**缺失知识响应**
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

**错误响应**
```json
{
    "detail": "string"  // 错误描述
}
```

## 知识库管理 API

### POST /api/knowledge

创建新的知识条目。

**请求体**
```json
{
    "topic": "string",           // 知识主题
    "content": {                 // 知识内容（JSON格式）
        "name": "string",
        "description": "string"
    },
    "description": "string"      // 知识描述（可选）
}
```

**响应**
```json
{
    "id": 1,
    "topic": "company_info",
    "content": {
        "name": "GeoCMS科技",
        "description": "AI驱动的智能建站系统"
    },
    "description": "公司基本信息",
    "created_at": "2024-12-12T10:00:00Z",
    "updated_at": "2024-12-12T10:00:00Z"
}
```

### GET /api/knowledge

获取所有知识条目列表。

**响应**
```json
[
    {
        "id": 1,
        "topic": "company_info",
        "content": {...},
        "description": "公司基本信息",
        "created_at": "2024-12-12T10:00:00Z",
        "updated_at": "2024-12-12T10:00:00Z"
    }
]
```

### GET /api/knowledge/{topic}

根据主题获取特定知识。

**响应**
```json
{
    "id": 1,
    "topic": "company_info",
    "content": {
        "name": "GeoCMS科技",
        "description": "AI驱动的智能建站系统"
    },
    "description": "公司基本信息",
    "created_at": "2024-12-12T10:00:00Z",
    "updated_at": "2024-12-12T10:00:00Z"
}
```

### PUT /api/knowledge/{id}

更新知识条目。

**请求体**
```json
{
    "topic": "string",      // 可选
    "content": {...},       // 可选
    "description": "string" // 可选
}
```

### DELETE /api/knowledge/{id}

删除知识条目。

**响应**
```json
{
    "message": "知识删除成功"
}
```

### GET /api/knowledge/templates/list

获取所有知识模板。

**响应**
```json
{
    "templates": ["company_info", "product_info", "brand_info", "service_info"],
    "details": {
        "company_info": {
            "name": "公司名称",
            "description": "公司简介",
            "mission": "公司使命"
        }
    }
}
```

### GET /api/knowledge/templates/{type}

获取特定类型的知识模板。

### POST /api/knowledge/search

根据关键词搜索知识。

**请求体**
```json
["关键词1", "关键词2"]
```

### GET /api/knowledge/stats/summary

获取知识库统计信息。

**响应**
```json
{
    "total_knowledge": 5,
    "topic_counts": {
        "company_info": 2,
        "product_info": 3
    },
    "available_templates": ["company_info", "product_info", "brand_info", "service_info"]
}
```

## 性能指标

| 指标 | 要求 | 当前状态 |
|------|------|----------|
| 响应时间 | ≤2 秒 | ✅ 达标 |
| 成功率 | >95% | ✅ 98/98 测试通过 |
| 数据完整性 | 100% | ✅ 完整持久化 |
| 知识检索 | ≤500ms | ✅ 索引优化 |

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## 使用示例

详细的使用示例请参考 `docs/examples/demo_knowledge.py`。
