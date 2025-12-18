/**
 * Intent Calculator
 * 
 * 基于通话标签量化计算客户意向分数
 * 
 * 设计原则：
 * 1. 正向意向信号（Intent 维度）增加分数
 * 2. 负向约束信号（Constraint 维度）减少分数
 * 3. 决策者身份作为加成因素
 * 
 * 分数范围：0-100
 * 等级划分：High (>=70), Medium (>=40), Low (<40)
 */

// 标签打分数据结构
export interface CallTagScore {
    tagId: string
    tagCode: string
    tagName?: string
    category?: string
    dimension?: string
    score: number  // 1-100 (已归一化)
}

// 意向计算结果
export interface PredictedIntent {
    score: number           // 0-100
    grade: 'High' | 'Medium' | 'Low'
    confidence: number      // 0-1
    factors: {
        positive: string[]    // 正向因素标签名
        negative: string[]    // 负向因素标签名
    }
}

// 权重配置
const INTENT_WEIGHTS = {
    // 正向意向信号（Customer.Intent 维度）
    positive: {
        'customer_high_intent': 0.35,         // 高意向：权重最高
        'customer_schedule_request': 0.20,    // 时间安排请求：强烈意向信号
        'customer_solution_request': 0.15,    // 解决方案请求
        'customer_pricing_request': 0.10,     // 价格询问
    },

    // 负向约束信号（Customer.Constraint 维度）
    negative: {
        'customer_objection_price': -0.10,    // 价格异议
        'customer_objection_trust': -0.12,    // 信任异议（影响最大）
        'customer_objection_time': -0.06,     // 时间异议
        'customer_objection_scope': -0.06,    // 范围异议
    },

    // 决策者加成
    decisionMaker: {
        'customer_role_owner': 8,             // 是决策者加8分
    }
}

// 等级阈值
const GRADE_THRESHOLDS = {
    high: 70,
    medium: 40,
}

/**
 * 计算客户意向分数
 * 
 * @param tagScores 通话的标签打分列表
 * @returns PredictedIntent 预测意向结果
 */
export function calculateIntent(tagScores: CallTagScore[]): PredictedIntent {
    let score = 50  // 基准分
    const positiveFactors: string[] = []
    const negativeFactors: string[] = []
    let factorCount = 0

    // 构建标签代码到打分的映射
    const tagMap = new Map<string, CallTagScore>()
    for (const s of tagScores) {
        tagMap.set(s.tagCode, s)
    }

    // 计算正向分数
    for (const [tagCode, weight] of Object.entries(INTENT_WEIGHTS.positive)) {
        const tagScore = tagMap.get(tagCode)
        if (tagScore) {
            // 将标签分数（1-100）乘以权重，贡献到总分
            // 标签分数高意味着信号强度高
            const contribution = (tagScore.score / 100) * weight * 100
            score += contribution
            positiveFactors.push(tagScore.tagName || tagCode)
            factorCount++
        }
    }

    // 计算负向分数
    for (const [tagCode, weight] of Object.entries(INTENT_WEIGHTS.negative)) {
        const tagScore = tagMap.get(tagCode)
        if (tagScore) {
            // 异议分数越高，表示异议越强烈，扣分越多
            const contribution = (tagScore.score / 100) * weight * 100
            score += contribution  // weight 已经是负数
            negativeFactors.push(tagScore.tagName || tagCode)
            factorCount++
        }
    }

    // 决策者加成
    for (const [tagCode, bonus] of Object.entries(INTENT_WEIGHTS.decisionMaker)) {
        const tagScore = tagMap.get(tagCode)
        if (tagScore && tagScore.score >= 60) {  // 分数 >= 60 视为确认是决策者
            score += bonus
            positiveFactors.push('决策者')
            factorCount++
        }
    }

    // 限制分数范围
    score = Math.max(0, Math.min(100, Math.round(score)))

    // 计算置信度（基于有多少相关标签被检测到）
    const totalPossibleFactors = Object.keys(INTENT_WEIGHTS.positive).length
        + Object.keys(INTENT_WEIGHTS.negative).length
        + Object.keys(INTENT_WEIGHTS.decisionMaker).length
    const confidence = Math.min(1, factorCount / (totalPossibleFactors * 0.6))  // 60% 覆盖率视为高置信度

    // 确定等级
    let grade: 'High' | 'Medium' | 'Low'
    if (score >= GRADE_THRESHOLDS.high) {
        grade = 'High'
    } else if (score >= GRADE_THRESHOLDS.medium) {
        grade = 'Medium'
    } else {
        grade = 'Low'
    }

    return {
        score,
        grade,
        confidence: Math.round(confidence * 100) / 100,
        factors: {
            positive: positiveFactors,
            negative: negativeFactors,
        }
    }
}

/**
 * 批量计算意向分数（用于列表页）
 * 
 * @param callTagScores 按 callId 分组的打分数据
 * @returns Map<callId, PredictedIntent>
 */
export function calculateIntentBatch(
    callTagScores: Map<string, CallTagScore[]>
): Map<string, PredictedIntent> {
    const results = new Map<string, PredictedIntent>()

    for (const [callId, tagScores] of callTagScores) {
        results.set(callId, calculateIntent(tagScores))
    }

    return results
}

/**
 * 获取意向等级的显示配置
 */
export function getIntentGradeConfig(grade: 'High' | 'Medium' | 'Low') {
    switch (grade) {
        case 'High':
            return {
                label: '高意向',
                color: 'text-emerald-700',
                bgColor: 'bg-emerald-100',
                borderColor: 'border-emerald-200',
                icon: '🔥'
            }
        case 'Medium':
            return {
                label: '中等意向',
                color: 'text-amber-700',
                bgColor: 'bg-amber-100',
                borderColor: 'border-amber-200',
                icon: '💡'
            }
        case 'Low':
            return {
                label: '低意向',
                color: 'text-slate-600',
                bgColor: 'bg-slate-100',
                borderColor: 'border-slate-200',
                icon: '❄️'
            }
    }
}
