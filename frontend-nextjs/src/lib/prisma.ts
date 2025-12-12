/**
 * Prisma Client 单例实例
 * 
 * 用于在 Next.js 应用中安全地使用 Prisma Client。
 * 使用 better-sqlite3 driver adapter (Prisma 7+ 必需)
 */

import { PrismaClient } from '@/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// 数据库文件路径（相对于项目根目录）
const DATABASE_URL = 'file:./team-calls.db'

// 创建 Prisma adapter
// 注意：Prisma 7 使用 url 配置而不是直接传入数据库实例
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })

// 声明全局变量类型
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

// 创建 Prisma Client 实例
// 在生产环境中直接创建新实例
// 在开发环境中复用全局实例，避免热重载问题
function createPrismaClient(): PrismaClient {
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    })
}

export const prisma: PrismaClient =
    globalThis.prisma ?? createPrismaClient()

// 开发环境下保存到全局变量
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}

export default prisma
