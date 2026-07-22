/**
 * Prisma Client 单例实例
 * 
 * 支持双数据库策略 (使用 Prisma 7 Driver Adapters):
 * - 本地开发: SQLite (使用 @prisma/adapter-better-sqlite3)
 * - Vercel 生产: Supabase PostgreSQL (使用 @prisma/adapter-pg)
 * 
 * 这是 Prisma 7 官方推荐的配置方式。
 * 
 * 通过环境变量控制：
 * - DATABASE_PROVIDER = "sqlite" | "postgresql"
 * - DATABASE_URL = 数据库连接字符串
 */

import { PrismaClient } from '@/generated/prisma'

// 声明全局变量类型
declare global {
    // eslint-disable-next-line no-var
    var _prisma: PrismaClient | undefined
}

// 检测当前环境
const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'
const databaseProvider = process.env.DATABASE_PROVIDER || (isVercel ? 'postgresql' : 'sqlite')

/**
 * 创建 Prisma Client 实例
 * 使用 Prisma 7 Driver Adapters 模式
 */
function createPrismaClient(): PrismaClient {
    // PostgreSQL (Vercel/Supabase)
    if (databaseProvider === 'postgresql') {
        console.log('[Prisma] Using PostgreSQL with @prisma/adapter-pg')

        // 动态导入以避免在 SQLite 环境加载 pg
        const { PrismaPg } = require('@prisma/adapter-pg')
        const connectionString = process.env.DATABASE_URL

        if (!connectionString) {
            throw new Error('DATABASE_URL is required for PostgreSQL')
        }

        const adapter = new PrismaPg({ connectionString })

        return new PrismaClient({
            adapter,
            log: isProduction ? ['error'] : ['query', 'error', 'warn'],
        })
    }

    // SQLite (本地开发)
    console.log('[Prisma] Using SQLite with @prisma/adapter-better-sqlite3')

    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const DATABASE_URL = process.env.DATABASE_URL || 'file:./team-calls.db'
    const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })

    return new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })
}

// 使用延迟初始化的单例模式
function getPrismaClient(): PrismaClient {
    if (globalThis._prisma) {
        return globalThis._prisma
    }

    const client = createPrismaClient()

    // 开发环境下保存到全局变量，避免热重载问题
    if (!isProduction) {
        globalThis._prisma = client
    }

    return client
}

// 使用 Proxy 实现延迟初始化
// 只有在实际使用时才创建客户端，避免构建时执行
const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        const client = getPrismaClient()
        return (client as any)[prop]
    }
})

export default prisma
export { prisma }
