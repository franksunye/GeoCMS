/**
 * 加载状态组件
 */

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 加载旋转器
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  )
}

/**
 * 全屏加载
 */
export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * 页面加载
 */
export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * 按钮加载状态
 */
export function LoadingButton({
  loading,
  children,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" className="absolute left-4" />
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  )
}

/**
 * 内联加载
 */
export function LoadingInline({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}

/**
 * 加载覆盖层
 */
export function LoadingOverlay({ show, message }: { show: boolean; message?: string }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
      <div className="text-center">
        <LoadingSpinner size="md" />
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * 进度条
 */
export function ProgressBar({ 
  progress, 
  showPercentage = true,
  className 
}: { 
  progress: number
  showPercentage?: boolean
  className?: string 
}) {
  const percentage = Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>进度</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * 脉冲加载动画
 */
export function PulseLoader() {
  return (
    <div className="flex gap-2">
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

