# 数据库升级完成报告

## ✅ 已完成的改动

### 1. **数据库表结构升级**

#### `call_signals` 表（新结构）
```sql
CREATE TABLE call_signals (
  id TEXT PRIMARY KEY,
  callId TEXT NOT NULL,
  signalCode TEXT NOT NULL,
  category TEXT,                    -- ✨ 新增
  dimension TEXT,                   -- ✨ 新增
  polarity TEXT,                    -- ✨ 新增
  timestamp_sec REAL,               -- ✨ 新增（替代 detectedAt）
  confidence REAL DEFAULT 0,
  context_text TEXT,
  reasoning TEXT,                   -- ✨ 新增
  createdAt TEXT NOT NULL,          -- ✨ 新增
  FOREIGN KEY(callId) REFERENCES calls(id)
)
```

**关键变化：**
- ❌ 移除了 `detectedAt` (字符串) → ✅ 改用 `timestamp_sec` (数字，秒)
- ❌ 移除了 `metadata` (通用 JSON) → ✅ 拆分为具体字段
- ❌ 移除了 `signalCode` 的外键约束 → 允许存储未知信号
- ✅ 新增 `category`, `dimension`, `polarity`, `reasoning`, `createdAt`
- ✅ 添加了索引：`idx_call_signals_callId`, `idx_call_signals_signalCode`

#### `call_assessments` 表（增强）
```sql
ALTER TABLE call_assessments ADD COLUMN context_events TEXT;
```

**新增字段：**
- `context_events`: JSON 数组，存储多个上下文事件

---

### 2. **ETL 脚本升级** (`scripts/etl-process.ts`)

#### 支持新的 signals 格式
```typescript
interface NewSignalsFormat {
  signal_events: SignalEvent[]  // 原始事件级信号
  tags: TagEvent[]              // 聚合后的标签评估
}
```

#### 处理流程
1. **解析新格式**：分别处理 `signal_events` 和 `tags`
2. **存储原始信号** → `call_signals` 表
   - 直接存储所有 signal_events
   - 保留完整的 timestamp_sec, confidence, reasoning
3. **存储聚合标签** → `call_assessments` 表
   - 转换 score (1-5 → 0-100)
   - 聚合 context_events
   - 计算最大 confidence 和最早 timestamp

---

### 3. **数据验证结果**

✅ **ETL 成功执行**
- 处理了 10 条 AI 分析日志
- 插入了 186 条原始信号 (`call_signals`)
- 插入了 103 条标签评估 (`call_assessments`)
- 创建了 10 条通话记录 (`calls`)

✅ **数据示例**
```
signalCode              | category | dimension | timestamp_sec | confidence
------------------------|----------|-----------|---------------|------------
opening_complete        | Sales    | Process   | 2.26          | 0.95
needs_identification_   | Sales    | Process   | 15.32         | 1.0
  basic                 |          |           |               |
needs_identification_   | Sales    | Process   | 18.82         | 1.0
  deep                  |          |           |               |
```

---

## 📊 数据关系图（更新后）

```
┌──────────────────┐
│      calls       │
│  id (PK)         │
└────────┬─────────┘
         │
         │ 1:N
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   call_signals   │      │ call_assessments │
│  (原始事件信号)    │      │  (聚合标签评估)    │
├──────────────────┤      ├──────────────────┤
│ signalCode       │      │ tagId (FK)       │
│ category         │      │ score (0-100)    │
│ dimension        │      │ confidence       │
│ polarity         │      │ reasoning        │
│ timestamp_sec    │      │ context_events   │
│ confidence       │      │ timestamp_sec    │
│ context_text     │      └──────────────────┘
│ reasoning        │
└──────────────────┘
```

---

## 🔍 前端查询支持

### 现在可以支持的查询场景

1. **获取 Call 的所有原始信号**
```sql
SELECT * FROM call_signals WHERE callId = ?
```

2. **获取 Call 的所有标签评估**
```sql
SELECT ca.*, t.name, t.code 
FROM call_assessments ca
JOIN tags t ON ca.tagId = t.id
WHERE ca.callId = ?
```

3. **通过信号查询关联的标签**
```sql
SELECT cs.*, s.targetTagCode, t.name as tagName
FROM call_signals cs
LEFT JOIN signals s ON cs.signalCode = s.code
LEFT JOIN tags t ON s.targetTagCode = t.code
WHERE cs.callId = ?
```

4. **Metadata 面板展示**
前端可以直接使用 `call_signals` 表的数据，包含：
- ✅ signalCode, category, dimension, polarity
- ✅ timestamp_sec (精确时间)
- ✅ confidence, context_text, reasoning

---

## 📝 后续建议

### 可选优化（暂未实施）

1. **添加 `call_signals.targetTagCode` 字段**
   - 冗余但提高查询效率
   - 避免 JOIN signals 配置表

2. **为 `call_assessments` 添加分类字段**
   - 冗余 `category`, `dimension` 字段
   - 便于按维度聚合查询

3. **创建视图简化查询**
```sql
CREATE VIEW call_metadata AS
SELECT 
  cs.*,
  s.targetTagCode,
  t.name as tagName
FROM call_signals cs
LEFT JOIN signals s ON cs.signalCode = s.code
LEFT JOIN tags t ON s.targetTagCode = t.code;
```

---

## ✨ 总结

✅ **数据库结构已完全升级**
✅ **ETL 脚本已适配新格式**
✅ **数据已成功导入并验证**
✅ **支持前端所有查询需求**

**下一步：**
- 前端 API 无需修改（已兼容）
- 可以开始使用新的 `call_signals` 表数据
- Metadata 面板将显示更丰富的信号信息
