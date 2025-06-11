# API 文档

## PoC 阶段 API

### 内容生成 API

#### POST /api/run-prompt

生成基于 Prompt 的内容。

**请求体**
```json
{
    "prompt": "string"  // 用户输入的 Prompt 文本
}
```

**响应**
```json
{
    "id": "uuid",           // 生成内容的唯一标识
    "prompt_id": "uuid",    // 关联的 Prompt ID
    "content": {            // 生成的结构化内容
        "title": "string",
        "headings": ["string"],
        "paragraphs": ["string"],
        "faqs": [
            {
                "question": "string",
                "answer": "string"
            }
        ]
    },
    "version": 1,           // 内容版本号
    "created_at": "timestamp"
}
```

**错误响应**
```json
{
    "error": {
        "code": "string",   // 错误代码
        "message": "string" // 错误描述
    }
}
```

### 成功标准

| 指标 | 要求 |
|------|------|
| 响应时间 | ≤10 秒 |
| 成功率 | >90% |
| 数据完整性 | Prompt 和生成内容正确持久化 |

## 后续 API 规划
- 内容版本管理 API
- 页面部署 API
- RAG 检测 API 