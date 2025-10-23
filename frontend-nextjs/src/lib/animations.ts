/**
 * 动画工具函数和配置
 */

/**
 * 淡入动画
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

/**
 * 从下方滑入
 */
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3 },
}

/**
 * 从上方滑入
 */
export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

/**
 * 从左侧滑入
 */
export const slideRight = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 },
}

/**
 * 从右侧滑入
 */
export const slideLeft = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
}

/**
 * 缩放动画
 */
export const scale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
}

/**
 * 列表项交错动画
 */
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

/**
 * 列表项动画
 */
export const listItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

/**
 * 弹跳动画
 */
export const bounce = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
  exit: { scale: 0 },
}

/**
 * 旋转动画
 */
export const rotate = {
  initial: { rotate: 0 },
  animate: { rotate: 360 },
  transition: { 
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
}

/**
 * CSS类名动画
 */
export const transitionClasses = {
  // 淡入淡出
  fade: 'transition-opacity duration-200',
  
  // 滑动
  slide: 'transition-all duration-300 ease-in-out',
  
  // 缩放
  scale: 'transition-transform duration-200',
  
  // 颜色
  color: 'transition-colors duration-200',
  
  // 阴影
  shadow: 'transition-shadow duration-200',
  
  // 全部
  all: 'transition-all duration-200',
}

/**
 * 悬停效果类名
 */
export const hoverClasses = {
  // 提升
  lift: 'hover:-translate-y-1 hover:shadow-lg',
  
  // 缩放
  scale: 'hover:scale-105',
  
  // 亮度
  brightness: 'hover:brightness-110',
  
  // 背景色
  bg: 'hover:bg-gray-50',
  
  // 边框
  border: 'hover:border-primary',
}

/**
 * 加载动画类名
 */
export const loadingClasses = {
  // 脉冲
  pulse: 'animate-pulse',
  
  // 旋转
  spin: 'animate-spin',
  
  // 弹跳
  bounce: 'animate-bounce',
  
  // 渐变
  shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
}

/**
 * 页面过渡配置
 */
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
}

/**
 * 模态框动画
 */
export const modalAnimation = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.2 },
  },
}

/**
 * 通知动画
 */
export const notificationAnimation = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
}

/**
 * 抽屉动画
 */
export const drawerAnimation = {
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
}

/**
 * 延迟函数
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 缓动函数
 */
export const easing = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
}

