/**
 * Prisma Client 单例实例
 * 
 * 支持双数据库策略：
 * - 本地开发: SQLite (使用 better-sqlite3 adapter)
 * - Vercel 生产: Supabase PostgreSQL
 * 
 * 通过环境变量 DATABASE_PROVIDER 控制：
 * - "sqlite" = 本地 SQLite
 * - "postgresql" = Supabase/PostgreSQL (默认在 Vercel)
 */

import { PrismaClient } from '@/generated/prisma'

// 检测当前环境使用的数据库类型
const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'
const databaseProvider = process.env.DATABASE_PROVIDER || (isVercel ? 'postgresql' : 'sqlite')

// 声明全局变量类型
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

// 创建 Prisma Client 实例
function createPrismaClient(): PrismaClient {
    // 在 Vercel/生产环境使用 PostgreSQL，无需 adapter
    if (databaseProvider === 'postgresql') {
        console.log('[Prisma] Using PostgreSQL (Supabase)')
        return new PrismaClient({
            log: isProduction ? ['error'] : ['query', 'error', 'warn'],
        })
    }

    // 本地开发环境使用 SQLite + better-sqlite3 adapter
    console.log('[Prisma] Using SQLite (local development)')

    // 动态导入 better-sqlite3 adapter（仅在本地需要）
    // 这样在 Vercel 环境不会尝试加载 native 模块
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const DATABASE_URL = process.env.DATABASE_URL || 'file:./team-calls.db'
    const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })

    return new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })
}

export const prisma: PrismaClient =
    globalThis.prisma ?? createPrismaClient()

// 开发环境下保存到全局变量，避免热重载问题
if (!isProduction) {
    globalThis.prisma = prisma
}

export default prisma
