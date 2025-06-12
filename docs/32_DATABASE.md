# 数据库设计文档

## 概述

GeoCMS 使用 SQLite 作为数据库（PoC阶段），主要存储内容生成记录、用户配置等信息。

## 表结构

### 1. prompts 表

存储提示词处理记录。

```sql
CREATE TABLE prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_text TEXT NOT NULL,           -- 原始提示词
    content_type TEXT NOT NULL,          -- 内容类型（article/webpage/faq等）
    structure JSON,                      -- 内容结构需求
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. contents 表

存储生成的内容。

```sql
CREATE TABLE contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,          -- 关联的提示词ID
    content_text TEXT NOT NULL,          -- 生成的内容
    metadata JSON,                       -- 元数据（标题、章节等）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);
```

### 3. settings 表

存储系统配置。

```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,            -- 配置键
    value TEXT,                          -- 配置值
    description TEXT,                    -- 配置说明
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 索引设计

```sql
-- prompts 表索引
CREATE INDEX idx_prompts_content_type ON prompts(content_type);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);

-- contents 表索引
CREATE INDEX idx_contents_prompt_id ON contents(prompt_id);
CREATE INDEX idx_contents_created_at ON contents(created_at);
```

## 关系图

```
prompts 1 ---- * contents
   |
   |-- content_type: 内容类型
   |-- structure: 内容结构
   |
contents
   |
   |-- content_text: 生成内容
   |-- metadata: 元数据
```

## 数据模型

### Prompt 模型
```python
class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True)
    prompt_text = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    structure = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Content 模型
```python
class Content(Base):
    __tablename__ = "contents"
    
    id = Column(Integer, primary_key=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    content_text = Column(String, nullable=False)
    metadata = Column(JSON)
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
   - 为常用查询字段创建索引
   - 避免过度索引

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