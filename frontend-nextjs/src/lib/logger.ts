/**
 * Logger Module
 * 
 * 统一的日志系统，支持：
 * - 日志级别 (debug, info, warn, error)
 * - 性能计时
 * - 结构化日志输出
 * - 开发环境彩色输出
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    timestamp: string
    level: LogLevel
    module: string
    message: string
    data?: Record<string, unknown>
    duration?: number
}

// 日志级别优先级
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

// 从环境变量获取最小日志级别
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug'

// 控制台颜色 (开发环境)
const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    debug: '\x1b[36m',   // Cyan
    info: '\x1b[32m',    // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    time: '\x1b[35m',    // Magenta
}

const isDev = process.env.NODE_ENV === 'development'

/**
 * 格式化日志输出
 */
function formatLog(entry: LogEntry): string {
    const { timestamp, level, module, message, data, duration } = entry

    if (isDev) {
        // 开发环境：彩色格式化输出
        const color = COLORS[level]
        const timeStr = `${COLORS.dim}[${timestamp}]${COLORS.reset}`
        const levelStr = `${color}${level.toUpperCase().padEnd(5)}${COLORS.reset}`
        const moduleStr = `${COLORS.bold}[${module}]${COLORS.reset}`
        const durationStr = duration !== undefined
            ? ` ${COLORS.time}(${duration}ms)${COLORS.reset}`
            : ''
        const dataStr = data ? `\n  ${COLORS.dim}${JSON.stringify(data)}${COLORS.reset}` : ''

        return `${timeStr} ${levelStr} ${moduleStr} ${message}${durationStr}${dataStr}`
    } else {
        // 生产环境：JSON 格式便于日志聚合
        return JSON.stringify(entry)
    }
}

/**
 * 核心日志函数
 */
function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>, duration?: number) {
    if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
        return // 低于最小级别的日志不输出
    }

    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        module,
        message,
        data,
        duration,
    }

    const output = formatLog(entry)

    switch (level) {
        case 'error':
            console.error(output)
            break
        case 'warn':
            console.warn(output)
            break
        default:
            console.log(output)
    }
}

/**
 * 创建模块专用 Logger
 */
export function createLogger(moduleName: string) {
    return {
        debug: (message: string, data?: Record<string, unknown>) => log('debug', moduleName, message, data),
        info: (message: string, data?: Record<string, unknown>) => log('info', moduleName, message, data),
        warn: (message: string, data?: Record<string, unknown>) => log('warn', moduleName, message, data),
        error: (message: string, data?: Record<string, unknown>) => log('error', moduleName, message, data),

        /**
         * 性能计时器
         * 
         * 用法:
         * ```
         * const timer = logger.startTimer('Database Query')
         * await prisma.findMany(...)
         * timer.end() // 自动输出: Database Query (123ms)
         * timer.end({ rows: 100 }) // 附加数据
         * ```
         */
        startTimer: (label: string) => {
            const start = performance.now()
            return {
                end: (data?: Record<string, unknown>) => {
                    const duration = Math.round(performance.now() - start)
                    log('info', moduleName, label, data, duration)
                    return duration
                },
                elapsed: () => Math.round(performance.now() - start),
            }
        },

        /**
         * 包装异步函数并自动计时
         * 
         * 用法:
         * ```
         * const result = await logger.time('Fetch Users', async () => {
         *   return await prisma.user.findMany()
         * })
         * ```
         */
        time: async <T>(label: string, fn: () => Promise<T>, data?: Record<string, unknown>): Promise<T> => {
            const start = performance.now()
            try {
                const result = await fn()
                const duration = Math.round(performance.now() - start)
                log('info', moduleName, label, data, duration)
                return result
            } catch (error) {
                const duration = Math.round(performance.now() - start)
                log('error', moduleName, `${label} [FAILED]`, { error: String(error), ...data }, duration)
                throw error
            }
        },
    }
}

// 默认导出一个通用 logger
export const logger = createLogger('App')

// 类型导出
export type Logger = ReturnType<typeof createLogger>
