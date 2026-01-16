# 本地测试 analyze_faq_ci.py

## 测试方法

### 1. 设置环境变量

```bash
# Windows PowerShell
$env:HUNYUAN_API_KEY="your_key_here"

# Linux/Mac
export HUNYUAN_API_KEY="your_key_here"
```

### 2. 本地 SQLite 测试

```bash
# 测试 10 条记录 (默认)
python scripts/analyze_faq_ci.py

# 测试 5 条记录
python scripts/analyze_faq_ci.py --limit 5

# 测试最近 7 天的数据
python scripts/analyze_faq_ci.py --limit 20 --days 7
```

### 3. 连接远程 PostgreSQL 测试

```bash
# 设置 DATABASE_URL
$env:DATABASE_URL="postgresql://user:pass@host:5432/db"

# 运行测试
python scripts/analyze_faq_ci.py --limit 10
```

## 验证结果

### 查看新增的 FAQ

```bash
sqlite3 team-calls.db "SELECT category, question FROM biz_faq_questions WHERE id LIKE 'faq_v3_%' ORDER BY created_at DESC LIMIT 10;"
```

### 查看执行日志

```bash
sqlite3 team-calls.db "SELECT prompt_id, status, execution_time_ms FROM log_prompt_execution WHERE prompt_id = 'faq_v3_ci' ORDER BY created_at DESC LIMIT 10;"
```

## 注意事项

1. **默认限制**: 本地测试默认只处理 10 条记录（避免消耗太多 API 调用）
2. **数据库自动检测**: 脚本会自动检测 SQLite 或 PostgreSQL
3. **幂等更新**: 重复运行会更新已有数据，不会重复插入
4. **版本标识**: 所有数据 ID 前缀为 `faq_v3_`，便于区分版本
