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
    'pending_materials': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-green-100 text-green-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-gray-100 text-gray-800',
    'pending_edit': 'bg-orange-100 text-orange-800',
    'edited': 'bg-cyan-100 text-cyan-800',
    'pending_review': 'bg-purple-100 text-purple-800',
    'approved': 'bg-green-100 text-green-800',
    'published': 'bg-gray-100 text-gray-800',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function calculateReadingTime(wordCount: number): string {
  const wordsPerMinute = 200
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min`
}

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000)
}

