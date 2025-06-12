# 数据库设计文档

## 概述

GeoCMS 使用 SQLite 作为数据库，存储提示词、生成的内容块和知识库数据。

## 表结构

### 1. agent_prompts 表

存储提示词记录。

```sql
CREATE TABLE agent_prompts (
    id INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    created_at DATETIME,
    PRIMARY KEY (id)
);
```

### 2. content_blocks 表

存储生成的内容块。

```sql
CREATE TABLE content_blocks (
    id INTEGER NOT NULL,
    prompt_id INTEGER,
    content TEXT NOT NULL,
    block_type VARCHAR(50) DEFAULT 'text',
    created_at DATETIME,
    PRIMARY KEY (id),
    FOREIGN KEY(prompt_id) REFERENCES agent_prompts (id)     
);
```

### 3. knowledge_base 表（新增）

存储知识库数据。

```sql
CREATE TABLE knowledge_base (
    id INTEGER NOT NULL,
    topic VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    PRIMARY KEY (id)
);

-- 为topic字段创建索引以优化查询
CREATE INDEX ix_knowledge_base_topic ON knowledge_base (topic);
```

## 索引设计

```sql
-- agent_prompts 表索引
CREATE INDEX ix_agent_prompts_id ON agent_prompts (id);      

-- content_blocks 表索引
CREATE INDEX ix_content_blocks_id ON content_blocks (id);    

-- knowledge_base 表索引
CREATE INDEX ix_knowledge_base_id ON knowledge_base (id);
CREATE INDEX ix_knowledge_base_topic ON knowledge_base (topic);
```

## 关系图

```
agent_prompts 1 ---- * content_blocks
   |
   |-- prompt_text: 提示词文本
   |-- created_at: 创建时间
   |
content_blocks
   |
   |-- content: 内容块文本（JSON格式）
   |-- block_type: 内容块类型
   |-- created_at: 创建时间

knowledge_base (独立表)
   |
   |-- topic: 知识主题
   |-- content: 知识内容（JSON格式）
   |-- description: 知识描述
   |-- created_at: 创建时间
   |-- updated_at: 更新时间
```

## 数据模型

### AgentPrompt 模型
```python
class AgentPrompt(Base):
    __tablename__ = "agent_prompts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    content_blocks = relationship("ContentBlock", back_populates="prompt")
```

### ContentBlock 模型
```python
class ContentBlock(Base):
    __tablename__ = "content_blocks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_id = Column(Integer, ForeignKey("agent_prompts.id"))
    content = Column(Text, nullable=False)  # JSON格式
    block_type = Column(String(50), default="text")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    prompt = relationship("AgentPrompt", back_populates="content_blocks")
```

### KnowledgeBase 模型（新增）
```python
class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)  # JSON格式存储
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

## 数据类型说明

### JSON 存储格式

#### ContentBlock.content
```json
{
    "title": "标题",
    "headings": ["章节1", "章节2"],
    "paragraphs": ["段落1", "段落2"],
    "faqs": [
        {"question": "问题", "answer": "答案"}
    ],
    "knowledge_sources": ["company_info", "product_info"]
}
```

#### KnowledgeBase.content
```json
{
    "name": "公司名称",
    "description": "公司描述",
    "mission": "公司使命",
    "vision": "公司愿景",
    "founded": "成立时间",
    "location": "公司地址"
}
```

## 查询优化

### 常用查询模式

#### 1. 知识检索查询
```sql
-- 根据主题查询知识
SELECT * FROM knowledge_base WHERE topic = 'company_info';

-- 模糊搜索知识
SELECT * FROM knowledge_base 
WHERE topic LIKE '%company%' 
   OR content LIKE '%关键词%' 
   OR description LIKE '%关键词%';
```

#### 2. 内容生成历史查询
```sql
-- 查询最近的内容生成记录
SELECT ap.prompt_text, cb.content, cb.created_at
FROM agent_prompts ap
JOIN content_blocks cb ON ap.id = cb.prompt_id
ORDER BY cb.created_at DESC
LIMIT 10;
```

### 性能优化策略

1. **索引优化**
   - topic字段索引：优化知识查询
   - 复合索引：考虑添加(topic, created_at)复合索引

2. **查询优化**
   - 使用参数化查询防止SQL注入
   - 避免SELECT *，只查询需要的字段
   - 使用LIMIT限制结果集大小

3. **数据维护**
   - 定期清理过期数据
   - 更新表统计信息
   - 重建索引（如需要）

## 数据迁移

### 自动初始化
```python
# app/db.py
def init_db():
    """初始化数据库表"""
    Base.metadata.create_all(bind=engine)
```

### 数据库升级
```python
# 添加新表的迁移脚本
def upgrade_to_v1_1():
    """升级到v1.1，添加knowledge_base表"""
    engine.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER NOT NULL,
            topic VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            description TEXT,
            created_at DATETIME,
            updated_at DATETIME,
            PRIMARY KEY (id)
        );
    """)
    engine.execute("""
        CREATE INDEX IF NOT EXISTS ix_knowledge_base_topic 
        ON knowledge_base (topic);
    """)
```

## 备份和恢复

### 备份策略
```bash
# 完整备份
sqlite3 geo_poc.db ".backup backup_$(date +%Y%m%d_%H%M%S).db"

# 导出SQL
sqlite3 geo_poc.db ".dump" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复流程
```bash
# 从备份文件恢复
cp backup_20241212_100000.db geo_poc.db

# 从SQL文件恢复
sqlite3 new_database.db < backup_20241212_100000.sql
```

## 监控和维护

### 数据库统计
```sql
-- 查看表大小
SELECT name, COUNT(*) as row_count 
FROM sqlite_master 
WHERE type='table';

-- 知识库统计
SELECT 
    topic,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(updated_at) as last_updated
FROM knowledge_base 
GROUP BY topic;
```

### 性能监控
```python
# 查询执行时间监控
import time
start_time = time.time()
result = db.query(KnowledgeBase).filter_by(topic='company_info').first()
execution_time = time.time() - start_time
logger.info(f"Query execution time: {execution_time:.3f}s")
```

## 未来规划

### 扩展性考虑
1. **分库分表**：当数据量增长时考虑分表策略
2. **读写分离**：高并发场景下的读写分离
3. **缓存层**：Redis缓存热点数据

### 迁移到PostgreSQL
```sql
-- PostgreSQL版本的表结构
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    content JSONB NOT NULL,  -- 使用JSONB类型
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JSONB索引
CREATE INDEX idx_knowledge_content_gin ON knowledge_base USING GIN (content);
```

---

## 更新记录

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|----------|------|
| 2024-06 | 1.0 | 初始版本 | AI Assistant |
| 2024-06 | 1.1 | 修正为实际数据库结构 | AI Assistant |
| 2024-12 | 2.0 | 添加知识库表设计 | AI Assistant |
