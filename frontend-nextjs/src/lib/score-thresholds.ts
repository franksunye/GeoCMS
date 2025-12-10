/**
 * 统一的评分阈值和颜色配置
 * 用于整个应用中的评分显示
 * 
 * 阈值定义：
 * - 优秀（绿色）：>= 80 分
 * - 良好（黄色）：60-79 分
 * - 需改进（红色）：< 60 分
 */

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
} as const

/**
 * 标签/信号评分阈值 (1-5分制)
 * - 优秀（绿色）：>= 4 分
 * - 良好（黄色）：3 分
 * - 需改进（红色）：< 3 分
 */
export const SIGNAL_SCORE_THRESHOLDS = {
  EXCELLENT: 4,
  GOOD: 3,
} as const

/**
 * 根据分数返回文字颜色样式
 * @param score 分数
 * @param maxScore 满分值（默认为 100）。如果为 5，则使用 1-5 分制阈值。
 * @returns Tailwind CSS 文字颜色类名
 */
export const getScoreColor = (score: number, maxScore: number = 100): string => {
  // 5 分制
  if (maxScore === 5) {
    if (score >= SIGNAL_SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600'
    if (score >= SIGNAL_SCORE_THRESHOLDS.GOOD) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  // 100 分制 (默认)
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * 根据分数返回背景和边框颜色样式
 * @param score 分数
 * @param maxScore 满分值（默认为 100）
 * @returns Tailwind CSS 背景和边框类名
 */
export const getScoreBgColor = (score: number, maxScore: number = 100): string => {
  if (maxScore === 5) {
    if (score >= SIGNAL_SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-50 border-green-200'
    if (score >= SIGNAL_SCORE_THRESHOLDS.GOOD) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-50 border-green-200'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

/**
 * 根据分数返回徽章（badge）样式
 * @param score 分数
 * @param maxScore 满分值（默认为 100）
 * @returns Tailwind CSS 背景和文字颜色类名
 */
export const getScoreBadgeClass = (score: number, maxScore: number = 100): string => {
  if (maxScore === 5) {
    if (score >= SIGNAL_SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-100 text-green-800'
    if (score >= SIGNAL_SCORE_THRESHOLDS.GOOD) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-100 text-green-800'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

/**
 * 根据分数返回进度条颜色样式
 * @param score 分数
 * @param maxScore 满分值（默认为 100）
 * @returns Tailwind CSS 背景颜色类名
 */
export const getScoreBarColor = (score: number, maxScore: number = 100): string => {
  if (maxScore === 5) {
    if (score >= SIGNAL_SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-500'
    if (score >= SIGNAL_SCORE_THRESHOLDS.GOOD) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-500'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-yellow-500'
  return 'bg-red-500'
}
