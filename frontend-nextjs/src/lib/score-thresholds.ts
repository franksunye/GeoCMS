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
 * 根据分数返回文字颜色样式
 * @param score 分数（0-100）
 * @returns Tailwind CSS 文字颜色类名
 */
export const getScoreColor = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * 根据分数返回背景和边框颜色样式
 * @param score 分数（0-100）
 * @returns Tailwind CSS 背景和边框类名
 */
export const getScoreBgColor = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-50 border-green-200'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

/**
 * 根据分数返回徽章（badge）样式
 * 用于列表项中的 inline 徽章显示
 * @param score 分数（0-100）
 * @returns Tailwind CSS 背景和文字颜色类名
 */
export const getScoreBadgeClass = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-100 text-green-800'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
