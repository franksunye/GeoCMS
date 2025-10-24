import { create } from 'zustand'
import { InboxItem } from '@/types'

interface WorkspaceStore {
  // Inbox state
  inboxItems: InboxItem[]
  unreadCount: number
  isInboxOpen: boolean
  
  // AI Assistant state
  isAssistantOpen: boolean
  
  // Sidebar state
  isSidebarCollapsed: boolean
  isSidebarPinned: boolean
  
  // Actions
  setInboxItems: (items: InboxItem[]) => void
  markAsRead: (id: string) => void
  removeInboxItem: (id: string) => void
  toggleInbox: () => void
  setInboxOpen: (open: boolean) => void
  
  toggleAssistant: () => void
  setAssistantOpen: (open: boolean) => void
  
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarPin: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  // Initial state
  inboxItems: [],
  unreadCount: 0,
  isInboxOpen: false,
  isAssistantOpen: false,
  isSidebarCollapsed: false,
  isSidebarPinned: false,
  
  // Inbox actions
  setInboxItems: (items) => set({ 
    inboxItems: items,
    unreadCount: items.filter(item => !item.isRead).length
  }),
  
  markAsRead: (id) => set((state) => {
    const updatedItems = state.inboxItems.map(item =>
      item.id === id ? { ...item, isRead: true } : item
    )
    return {
      inboxItems: updatedItems,
      unreadCount: updatedItems.filter(item => !item.isRead).length
    }
  }),
  
  removeInboxItem: (id) => set((state) => {
    const updatedItems = state.inboxItems.filter(item => item.id !== id)
    return {
      inboxItems: updatedItems,
      unreadCount: updatedItems.filter(item => !item.isRead).length
    }
  }),
  
  toggleInbox: () => set((state) => ({ isInboxOpen: !state.isInboxOpen })),
  setInboxOpen: (open) => set({ isInboxOpen: open }),
  
  // AI Assistant actions
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  setAssistantOpen: (open) => set({ isAssistantOpen: open }),
  
  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSidebarPin: () => set((state) => ({ isSidebarPinned: !state.isSidebarPinned })),
}))

