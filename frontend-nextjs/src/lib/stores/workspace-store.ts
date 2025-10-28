import { create } from 'zustand'
import { InboxItem } from '@/types'

interface WorkspaceStore {
  // Inbox state
  inboxItems: InboxItem[]
  unreadCount: number
  isInboxOpen: boolean
  isInboxPinned: boolean

  // AI Assistant state
  isAssistantOpen: boolean

  // Sidebar state
  isSidebarOpen: boolean

  // Actions
  setInboxItems: (items: InboxItem[]) => void
  markAsRead: (id: string) => void
  removeInboxItem: (id: string) => void
  toggleInbox: () => void
  setInboxOpen: (open: boolean) => void
  toggleInboxPin: () => void

  toggleAssistant: () => void
  setAssistantOpen: (open: boolean) => void

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  // Initial state
  inboxItems: [],
  unreadCount: 0,
  isInboxOpen: false,
  isInboxPinned: false,
  isAssistantOpen: false,
  isSidebarOpen: true, // Default to open like ChatGPT
  
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
  toggleInboxPin: () => set((state) => ({ isInboxPinned: !state.isInboxPinned })),

  // AI Assistant actions
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  setAssistantOpen: (open) => set({ isAssistantOpen: open }),

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))

