'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 错误边界组件
 * 捕获子组件中的JavaScript错误，显示备用UI
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 可以在这里上报错误到监控服务
    // reportErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              出错了
            </h2>
            
            <p className="text-gray-600 mb-6">
              抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  查看错误详情
                </summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded text-xs text-gray-700 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 简单的错误显示组件
 */
export function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: Error | string
  onRetry?: () => void 
}) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-3">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        加载失败
      </h3>
      
      <p className="text-red-700 mb-4">
        {errorMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          重试
        </button>
      )}
    </div>
  )
}

/**
 * 空状态组件
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 mb-6">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  )
}

