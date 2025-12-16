'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

const PopoverContext = React.createContext<PopoverContextType | null>(null)

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      
      // Check if click is inside popover content
      const popoverContent = document.querySelector('[data-popover-content]')
      if (popoverContent?.contains(target)) return
      
      setOpen(false)
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error('PopoverTrigger must be used within Popover')
  
  const { setOpen, open, triggerRef } = context

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e)
        setOpen(!open)
      }
    })
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function PopoverContent({ 
  children, 
  className = '',
  align = 'start',
  sideOffset = 4
}: PopoverContentProps) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error('PopoverContent must be used within Popover')
  
  const { open, triggerRef } = context
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open || !triggerRef.current) return
    
    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      
      const rect = trigger.getBoundingClientRect()
      const content = contentRef.current
      const contentWidth = content?.offsetWidth || 200
      
      let left = rect.left
      if (align === 'center') {
        left = rect.left + rect.width / 2 - contentWidth / 2
      } else if (align === 'end') {
        left = rect.right - contentWidth
      }
      
      // Keep within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - contentWidth - 8))
      
      setPosition({
        top: rect.bottom + sideOffset + window.scrollY,
        left: left + window.scrollX
      })
    }
    
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, align, sideOffset, triggerRef])

  if (!open) return null

  return createPortal(
    <div
      ref={contentRef}
      data-popover-content
      className={`fixed z-50 min-w-[8rem] rounded-md border bg-white shadow-lg animate-in fade-in-0 zoom-in-95 ${className}`}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>,
    document.body
  )
}
