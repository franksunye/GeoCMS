-- ========================================
-- 数据库表重命名迁移脚本
-- GeoCMS Table Rename Migration
-- 版本: 1.0
-- 日期: 2025-12-15
-- ========================================

-- 关闭外键约束（避免迁移时的约束错误）
PRAGMA foreign_keys = OFF;

-- ==================== 外部同步表 (sync_) ====================
-- 这些表的数据来自 Metabase/外部系统
ALTER TABLE agents RENAME TO sync_agents;
ALTER TABLE deals RENAME TO sync_deals;
ALTER TABLE transcripts RENAME TO sync_transcripts;
ALTER TABLE ai_analysis_logs RENAME TO sync_ai_analysis;

-- ==================== 系统配置表 (cfg_) ====================
-- 这些是系统核心配置，通过 UI 管理
ALTER TABLE tags RENAME TO cfg_tags;
ALTER TABLE signals RENAME TO cfg_signals;
ALTER TABLE scoring_rules RENAME TO cfg_scoring_rules;
ALTER TABLE score_config RENAME TO cfg_score_config;
ALTER TABLE prompts RENAME TO cfg_prompts;

-- ==================== 业务数据表 (biz_) ====================
-- ETL 产生的核心业务数据
ALTER TABLE calls RENAME TO biz_calls;
ALTER TABLE call_assessments RENAME TO biz_call_tags;
ALTER TABLE call_signals RENAME TO biz_call_signals;

-- ==================== 日志表 (log_) ====================
-- 系统运行日志
ALTER TABLE prompt_execution_logs RENAME TO log_prompt_execution;
ALTER TABLE audit_logs RENAME TO log_audit;

-- ==================== 重建索引 ====================
-- 删除旧索引
DROP INDEX IF EXISTS idx_call_signals_callId;
DROP INDEX IF EXISTS idx_call_signals_signalCode;
DROP INDEX IF EXISTS idx_prompt_logs_promptId;
DROP INDEX IF EXISTS idx_prompt_logs_callId;

-- 创建新索引（使用新表名）
CREATE INDEX IF NOT EXISTS idx_biz_call_signals_callId ON biz_call_signals(callId);
CREATE INDEX IF NOT EXISTS idx_biz_call_signals_signalCode ON biz_call_signals(signalCode);
CREATE INDEX IF NOT EXISTS idx_log_prompt_execution_promptId ON log_prompt_execution(promptId);
CREATE INDEX IF NOT EXISTS idx_log_prompt_execution_callId ON log_prompt_execution(callId);

-- 重新启用外键约束
PRAGMA foreign_keys = ON;

-- ==================== 验证迁移结果 ====================
SELECT '=== 迁移后的表列表 ===' AS info;
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
