# 数据库表重命名计划

## 📋 概述

将数据库表名按照数据来源和用途进行规范化命名，使表结构一目了然。

## 🎯 命名规范

| 前缀 | 含义 | 说明 |
|------|------|------|
| `sync_` | 外部同步数据 | 从 Metabase/外部系统同步的数据 |
| `cfg_` | 系统配置 | 系统核心配置表，可通过 UI 编辑 |
| `biz_` | 业务数据 | 系统产生的核心业务数据（ETL 产物等） |
| `log_` | 日志数据 | 系统运行日志、审计日志 |

---

## 📊 表名映射

### 外部同步表 (sync_)

| 原表名 | 新表名 | 数据来源 |
|--------|--------|----------|
| `agents` | `sync_agents` | Metabase Card #1940 |
| `deals` | `sync_deals` | Metabase Card #1939 |
| `transcripts` | `sync_transcripts` | Metabase Card #1938 |
| `ai_analysis_logs` | `sync_ai_analysis` | Metabase Card #1942 |

### 系统配置表 (cfg_)

| 原表名 | 新表名 | 说明 |
|--------|--------|------|
| `tags` | `cfg_tags` | 标签定义 |
| `signals` | `cfg_signals` | 信号定义 |
| `scoring_rules` | `cfg_scoring_rules` | 评分规则 |
| `score_config` | `cfg_score_config` | 评分权重配置 |
| `prompts` | `cfg_prompts` | AI 提示词模板 |

### 业务数据表 (biz_)

| 原表名 | 新表名 | 说明 |
|--------|--------|------|
| `calls` | `biz_calls` | 通话记录（ETL 产物） |
| `call_assessments` | `biz_call_tags` | 通话标签打分（ETL 产物） |
| `call_signals` | `biz_call_signals` | 通话信号（ETL 产物） |

### 日志表 (log_)

| 原表名 | 新表名 | 说明 |
|--------|--------|------|
| `prompt_execution_logs` | `log_prompt_execution` | 提示词执行日志 |
| `audit_logs` | `log_audit` | 系统审计日志 |

---

## 🔧 需要修改的文件

### 1. Prisma Schema
- **文件**: `prisma/schema.prisma`
- **修改**: 更新所有 `@@map()` 映射

### 2. Sync 脚本
- **文件**: `scripts/sync-metabase.ts`
- **修改**: 更新 `SYNC_JOBS` 中的 `tableName`

### 3. ETL 相关脚本
- **文件**: `scripts/etl-process.ts`
- **修改**: 使用 Prisma，无需直接修改（Prisma 处理映射）

- **文件**: `scripts/restore-tags-signals.ts`
- **修改**: 更新 SQL 中的表名 (`tags` → `cfg_tags`, `signals` → `cfg_signals`)

- **文件**: `scripts/update-mock-signals.ts`
- **修改**: 更新 SQL 中的表名

- **文件**: `scripts/sync-audio-urls.ts`
- **修改**: 使用 Prisma，无需直接修改

### 4. 索引更新
需要更新索引名称以匹配新表名：
- `idx_call_signals_callId` → `idx_biz_call_signals_callId`
- `idx_call_signals_signalCode` → `idx_biz_call_signals_signalCode`
- `idx_prompt_logs_promptId` → `idx_log_prompt_execution_promptId`
- `idx_prompt_logs_callId` → `idx_log_prompt_execution_callId`

---

## 📜 SQL 迁移脚本

```sql
-- ========================================
-- 数据库表重命名迁移脚本
-- GeoCMS Table Rename Migration
-- ========================================

-- 关闭外键约束
PRAGMA foreign_keys = OFF;

-- ==================== 外部同步表 ====================
ALTER TABLE agents RENAME TO sync_agents;
ALTER TABLE deals RENAME TO sync_deals;
ALTER TABLE transcripts RENAME TO sync_transcripts;
ALTER TABLE ai_analysis_logs RENAME TO sync_ai_analysis;

-- ==================== 系统配置表 ====================
ALTER TABLE tags RENAME TO cfg_tags;
ALTER TABLE signals RENAME TO cfg_signals;
ALTER TABLE scoring_rules RENAME TO cfg_scoring_rules;
ALTER TABLE score_config RENAME TO cfg_score_config;
ALTER TABLE prompts RENAME TO cfg_prompts;

-- ==================== 业务数据表 ====================
ALTER TABLE calls RENAME TO biz_calls;
ALTER TABLE call_assessments RENAME TO biz_call_tags;
ALTER TABLE call_signals RENAME TO biz_call_signals;

-- ==================== 日志表 ====================
ALTER TABLE prompt_execution_logs RENAME TO log_prompt_execution;
ALTER TABLE audit_logs RENAME TO log_audit;

-- ==================== 重建索引 ====================
-- 删除旧索引
DROP INDEX IF EXISTS idx_call_signals_callId;
DROP INDEX IF EXISTS idx_call_signals_signalCode;
DROP INDEX IF EXISTS idx_prompt_logs_promptId;
DROP INDEX IF EXISTS idx_prompt_logs_callId;

-- 创建新索引
CREATE INDEX idx_biz_call_signals_callId ON biz_call_signals(callId);
CREATE INDEX idx_biz_call_signals_signalCode ON biz_call_signals(signalCode);
CREATE INDEX idx_log_prompt_execution_promptId ON log_prompt_execution(promptId);
CREATE INDEX idx_log_prompt_execution_callId ON log_prompt_execution(callId);

-- 重新启用外键约束
PRAGMA foreign_keys = ON;

-- 验证
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

---

## ✅ 执行步骤

### Step 1: 备份数据库
```bash
cp team-calls.db team-calls.db.backup
```

### Step 2: 执行 SQL 迁移
```bash
sqlite3 team-calls.db < migration-rename-tables.sql
```

### Step 3: 更新 Prisma Schema
更新 `prisma/schema.prisma` 中的 `@@map()` 映射

### Step 4: 重新生成 Prisma Client
```bash
npx prisma generate
```

### Step 5: 更新脚本文件
- `scripts/sync-metabase.ts`
- `scripts/restore-tags-signals.ts`
- `scripts/update-mock-signals.ts`

### Step 6: 测试验证
```bash
npm run dev
npx tsx scripts/sync-metabase.ts --dry-run
```

---

## ⚠️ 注意事项

1. **备份优先**: 执行前务必备份数据库
2. **停止服务**: 执行迁移时确保没有活跃的数据库连接
3. **一次性执行**: 所有修改需要一起执行，避免部分更新导致的不一致
4. **Prisma 同步**: Prisma schema 的 `@@map` 只是映射，不会修改实际表名

---

## 📅 创建时间
2025-12-15
