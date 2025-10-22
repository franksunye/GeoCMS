import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = "yyyy-MM-dd HH:mm"): string {
  return format(new Date(date), formatStr, { locale: zhCN })
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    '待素材': 'bg-yellow-100 text-yellow-800',
    '已确认': 'bg-green-100 text-green-800',
    '进行中': 'bg-blue-100 text-blue-800',
    '已完成': 'bg-gray-100 text-gray-800',
    '待编辑': 'bg-orange-100 text-orange-800',
    '已编辑': 'bg-cyan-100 text-cyan-800',
    '待审核': 'bg-purple-100 text-purple-800',
    '已批准': 'bg-green-100 text-green-800',
    '已发布': 'bg-gray-100 text-gray-800',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function calculateReadingTime(wordCount: number): string {
  const wordsPerMinute = 200
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} 分钟`
}

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000)
}

