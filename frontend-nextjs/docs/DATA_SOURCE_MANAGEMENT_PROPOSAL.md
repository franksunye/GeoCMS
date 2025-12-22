# 数据源管理模块 (Data Source Management) 升级方案建议

## 1. 背景与痛点分析 (Background & Pain Points)

当前系统的“数据源概览”模块已实现了基础的资产分类与记录数统计，但在数据全生命周期的可观测性上仍存在以下不足：

1.  **时效性盲区 (Freshness Blindness)**：用户无法得知数据是何时从 Metabase 同步的，也无法确认 ETL 处理是否包含了最新的原始数据。
2.  **处理状态黑盒 (Processing Black Box)**：同步脚本 (`sync-metabase.ts`) 与处理脚本 (`etl-process.ts`) 是独立运行的 CLI 工具，运行状态（成功/失败/部分失败）无法通过 UI 反馈给管理员。
3.  **数据血缘断裂 (Lineage Gap)**：虽然逻辑上存在 `Sync -> ETL -> Biz` 的流向，但各环节之间缺乏联动。例如，当同步了 1000 条新记录时，系统无法主动提示管理员触发 ETL。

---

## 2. 总体设计方案 (Proposed Architecture)

建议将数据源从“静态展示”升级为“动态管理”，引入 **状态感知 (State-Aware)** 的架构。

### 2.1 存储层：任务审计日志 (`log_data_jobs`)
在数据库中建立统一的任务记录表，作为数据治理的信任根。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | String | 任务唯一标识 |
| `job_type` | Enum | `METABASE_SYNC`, `AI_ETL`, `DB_BACKUP` 等 |
| `target_scope` | String | 目标表或模块 (如 `sync_deals`, `all_biz`) |
| `status` | Enum | `RUNNING`, `SUCCESS`, `FAILED` |
| `records_total` | Int | 本次任务涉及的总记录数 |
| `records_processed`| Int | 成功处理的记录数 |
| `records_failed` | Int | 异常记录数 |
| `started_at` | DateTime | 任务启动时间 |
| `completed_at` | DateTime | 任务结束时间 |
| `error_details` | Text | 失败时的技术堆栈或原因描述 |

### 2.2 逻辑层：服务化 (Service-Oriented)
将分散的脚本逻辑封装为 `DataService`，使其既能通过 CLI 运行，也能通过 API 被 UI 触发。

*   **脚本增强**：在执行 `runSync()` 或 `runETL()` 时，自动在 `log_data_jobs` 写入生命周期记录。
*   **差异检测 (Delta Detection)**：计算 `sync_xx` 与 `biz_yy` 之间的记录数差距，作为 ETL 的必要性依据。

### 2.3 UI 层：功能升级
基于现有的卡片布局，增加以下反馈和控制能力：

1.  **时效性标签 (Freshness Indicators)**：
    *   在 Sync 卡片展示：“最后同步：2025-12-22 10:00”。
    *   在 Biz 卡片展示：“最后处理：2025-12-22 11:30”。
2.  **处理进度条 (Processing Gaps)**：
    *   如果发现 `Sync` 表增加了 500 条数据但 `Biz` 表未更新，展示：“512 条数据待处理”。
3.  **操作中心 (Manual Actions)**：
    *   增加 `[立即同步]` 与 `[触发 ETL]` 按钮，增强交互性。

---

## 3. 核心价值 (Core Value)

1.  **数据确定性**：管理员可以确信报表中的数字是基于什么时候的数据生成的。
2.  **运维透明化**：无需登录服务器查看终端日志，通过前端页面即可发现同步异常或 AI 处理中断。
3.  **资产完整性**：通过 Delta 检测确保每一路输入数据（Sync）都最终转化成了有效的业务结论（Biz）。

---

## 4. 实施阶段规划 (Implementation Phases)

### 第一阶段：审计入库 (Audit Onboarding)
*   [ ] Prisma Schema 增加 `DataJobLog` 模型。
*   [ ] 修改同步和处理脚本，在执行时记录 `started_at` 和 `completed_at`。

### 第二阶段：状态透传 (UI Awareness)
*   [ ] 升级数据源 API，透传任务日志中的时间戳。
*   [ ] 在“数据源概览”页面展示最后更新时间。

### 第三阶段：闭环管理 (Actionable UI)
*   [ ] 建立后端任务调度器（Queue/Worker）。
*   [ ] 实现 UI 上的按钮触发同步及处理流程。

---

*拟稿人：Antigravity AI Assist*
*日期：2025-12-22*
