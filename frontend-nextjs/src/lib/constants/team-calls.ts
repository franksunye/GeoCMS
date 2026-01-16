/**
 * 漏水部位一级分类选项
 */
export const LEAK_AREA_OPTIONS = [
    { value: '1', label: '屋面' },
    { value: '2', label: '卫生间' },
    { value: '3', label: '窗户' },
    { value: '4', label: '外墙' },
    { value: '5', label: '地下室' },
    { value: '6', label: '其他' },
    { value: '7', label: '厨房' },
] as const

export type LeakAreaValue = typeof LEAK_AREA_OPTIONS[number]['value']

/**
 * 时间预设选项
 */
export const TIME_PRESETS = [
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: 'month', label: '按月' },
    { value: 'custom', label: '自定义' },
    { value: 'all', label: '全部' },
] as const

export type TimePresetValue = typeof TIME_PRESETS[number]['value'] | 'today' | 'week'
