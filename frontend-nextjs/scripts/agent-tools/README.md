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

*   **`causal-ate-agent-stratified.ts`**
    *   **用途**: 计算 **ATE (Average Treatment Effect)**，使用销售员级别分层控制混杂。
    *   **运行**: `npx tsx scripts/agent-tools/causal-ate-agent-stratified.ts`

*   **`causal-psm-matching.ts`**
    *   **用途**: **倾向性得分匹配 (PSM)**，通过匹配相似销售员消除选择偏差。
    *   **核心功能**: 找出与高分销售员"特征相似"的低分销售员进行配对比较。
    *   **运行**: `npx tsx scripts/agent-tools/causal-psm-matching.ts`

*   **`causal-cross-method-comparison.ts`**
    *   **用途**: **跨方法一致性检验**，同时运行 Naive ATE 和 PSM ATT，验证结论稳健性。
    *   **核心功能**: 
        *   对比不同方法的结果方向是否一致
        *   揭示选择偏差修正后的真实因果效应
    *   **运行**: `npx tsx scripts/agent-tools/causal-cross-method-comparison.ts`
    *   **输出示例**:
        ```
        📊 Tag: "empathy_shown"
        Method        | Win Rate Effect | Consistency
        Naive ATE     |         -2.21% | ⚠️ 不一致
        PSM ATT       |         +6.67% | (选择偏差修正后逆转!)
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
