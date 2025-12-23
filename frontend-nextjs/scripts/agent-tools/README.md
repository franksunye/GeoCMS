# 销售分析工具集 (Agent Tools)

该目录包含了一系列用于深度分析销售表现、评分相关性以及提取实证话术的工具脚本。这些工具帮助我们将 AI 评分数据转化为可执行的业务洞察。

## 🛠 工具列表

### 1. 统计分析工具 (Statistical Analysis)

*   **`analyze-onsite-correlation.ts`**
    *   **用途**: 分析销售评分（总分、流程、技巧、沟通）与 **上门率 (Onsite Rate)** 之间的相关性。
    *   **核心功能**: 计算 Pearson 相关系数，并下钻到原子标签（Tag）级别，寻找驱动上门的统计学正相关指标。
    *   **运行**: `npx tsx scripts/agent-tools/analyze-onsite-correlation.ts`

*   **`analyze-win-correlation.ts`**
    *   **用途**: 分析销售评分与 **成交率 (Win Rate)** 之间的相关性。
    *   **核心功能**: 识别哪些评分维度与最终签单正相关，揭示“专家型销售”在电话阶段的转化陷阱。
    *   **运行**: `npx tsx scripts/agent-tools/analyze-win-correlation.ts`

*   **`analyze-score-correlation.ts`**
    *   **用途**: 基础评分相关性分析。

### 2. 因果推断工具 (Causal Inference)

*   **`analyze-causal-drivers.ts`**
    *   **用途**: 计算各销售动作的 **平均干预效果 (ATE - Average Treatment Effect)**，识别真正驱动转化的因果驱动力。
    *   **核心功能**: 
        *   使用销售员级别的分层策略控制混杂因素（Agent Skill Confounders）。
        *   对比"干预组"（展示高分行为的销售）与"对照组"的成交/上门率差异。
        *   揭示"专家陷阱"：某些高分行为可能实际上降低转化率。
    *   **运行**: `npx tsx scripts/agent-tools/analyze-causal-drivers.ts`
    *   **输出示例**:
        ```
        ✅ CAUSAL IMPACT ON WIN RATE:
        empathy_shown        | 共情表现   | -2.21% Win | +0.51% Onsite
        objection_handled    | 异议处理   | -3.80% Win | -4.59% Onsite
        attitude_positive    | 积极态度   | -7.46% Win | -4.31% Onsite (负因果!)
        ```

### 3. 实证采样工具 (Empirical Sampling)

*   **`sample-onsite-success-scripts.ts`**
    *   **用途**: 采样 **上门成功** 话术实证。
    *   **核心功能**: 从数据库中筛选出“高评分且成功上门”的正面案例，提取真实的通话片段（Context）和 AI 的打分推理（Reasoning），并标记精确时间点。
    *   **运行**: `npx tsx scripts/agent-tools/sample-onsite-success-scripts.ts`

*   **`sample-win-success-scripts.ts`**
    *   **用途**: 采样 **签单成功** 话术实证。
    *   **核心功能**: 寻找促成签单的黄金瞬间，分析高分流失案例中的“过度解释”问题，为话术手册提供真实数据支撑。
    *   **运行**: `npx tsx scripts/agent-tools/sample-win-success-scripts.ts`

## 🚀 运行环境

1.  **数据库**: 脚本默认连接 `frontend-nextjs/team-calls.db`。
2.  **配置**: 确保项目根目录下的 `.env` 文件配置了正确的 `DATABASE_URL`。
3.  **依赖**: 使用 `tsx` 直接运行 TypeScript 脚本，无需手动编译。

## 📊 文档输出

这些工具生成的分析结果已整理至以下业务文档中：

### 统计学分析报告
*   `docs/biz/analysis-onsite-correlation.md`: 上门率深度分析报告
*   `docs/biz/analysis-win-correlation.md`: 成交率深度分析报告

### 因果推断报告
*   `docs/biz/causal-analysis-onsite.md`: 上门率因果分析（从Why视角解释）
*   `docs/biz/causal-analysis-win.md`: 成交率因果分析（揭示"专家陷阱"）

### 实战手册
*   `docs/biz/onsite-conversion-playbook.md`: 上门促成实战话术手册
*   `docs/biz/win-conversion-playbook.md`: 签单成交实战话术手册
*   `docs/biz/causal-sales-checklist.md`: 因果律销售作战清单

### 体系重构建议
*   `docs/biz/scorecard-restructuring-proposal.md`: 评分体系重构建议书


## 💡 使用建议

当您调整了 AI 打分的 Prompt 或者更新了大量新数据后，建议重新运行这些脚本，以观察相关性系数的变化，并及时更新实战话术手册。
