import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /**
   * 页面标题文本
   */
  title: string
  
  /**
   * 可选的副标题或描述
   */
  description?: string
  
  /**
   * 标题右侧的操作按钮或其他元素
   */
  actions?: React.ReactNode
  
  /**
   * 自定义类名
   */
  className?: string
  
  /**
   * 标题级别，默认为 h1
   */
  as?: 'h1' | 'h2' | 'h3'
  
  /**
   * 标题左侧的图标或其他元素
   */
  icon?: React.ReactNode
}

/**
 * 统一的页面标题组件
 * 
 * 用于所有页面的主标题，确保统一的字体大小和样式
 * 默认使用 text-2xl (24px)，适配中文界面
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  as: Component = 'h1',
  icon,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <Component className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          {icon}
          {title}
        </Component>
        {description && (
          <p className="mt-2 text-gray-600">{description}</p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}
