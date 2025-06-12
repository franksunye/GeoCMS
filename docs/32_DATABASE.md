# 数据库设计文档

## 概述

GeoCMS 使用 SQLite 作为数据库，主要存储提示词和生成的内容块。

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
    block_type VARCHAR(50) NOT NULL,
    created_at DATETIME,
    PRIMARY KEY (id),
    FOREIGN KEY(prompt_id) REFERENCES agent_prompts (id)
);
```

## 索引设计

```sql
-- agent_prompts 表索引
CREATE INDEX ix_agent_prompts_id ON agent_prompts (id);

-- content_blocks 表索引
CREATE INDEX ix_content_blocks_id ON content_blocks (id);
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
   |-- content: 内容块文本
   |-- block_type: 内容块类型
   |-- created_at: 创建时间
```

## 数据模型

### AgentPrompt 模型
```python
class AgentPrompt(Base):
    __tablename__ = "agent_prompts"
    
    id = Column(Integer, primary_key=True)
    prompt_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### ContentBlock 模型
```python
class ContentBlock(Base):
    __tablename__ = "content_blocks"
    
    id = Column(Integer, primary_key=True)
    prompt_id = Column(Integer, ForeignKey("agent_prompts.id"))
    content = Column(String, nullable=False)
    block_type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

## 数据迁移

### 版本控制
- 使用 Alembic 进行数据库迁移管理
- 迁移脚本位于 `alembic/versions/` 目录

### 迁移命令
```bash
# 创建新的迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 性能优化

1. **索引优化**
   - 已为 id 字段创建索引
   - 考虑为常用查询字段添加索引

2. **查询优化**
   - 使用适当的 JOIN 策略
   - 避免 SELECT *
   - 使用 LIMIT 限制结果集

3. **数据清理**
   - 定期清理过期数据
   - 维护数据库统计信息

## 备份策略

1. **自动备份**
   - 每日全量备份
   - 每小时增量备份

2. **备份文件命名**
   ```
   backup_YYYYMMDD_HHMMSS.db
   ```

3. **恢复流程**
   ```bash
   # 恢复数据库
   sqlite3 database.db < backup_file.sql
   ```

## 未来规划

1. **扩展性考虑**
   - 预留字段扩展空间
   - 考虑分表策略

2. **性能优化**
   - 添加缓存层
   - 优化查询性能

3. **监控告警**
   - 数据库性能监控
   - 异常查询告警

---

## 更新记录

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|----------|------|
| 2024-06 | 1.0 | 初始版本 | AI Assistant |
| 2024-06 | 1.1 | 修正为实际数据库结构 | AI Assistant | 