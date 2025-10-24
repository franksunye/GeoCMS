'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  category: string
  tags: string[]
}

// Demo data
const DEMO_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'AI Trends 2024',
    date: new Date(2025, 0, 5),
    status: 'published',
    category: 'Technology',
    tags: ['AI', 'trending'],
  },
  {
    id: '2',
    title: 'Web Development Best Practices',
    date: new Date(2025, 0, 8),
    status: 'scheduled',
    category: 'Technology',
    tags: ['tutorial', 'web'],
  },
  {
    id: '3',
    title: 'Marketing Strategy Q1',
    date: new Date(2025, 0, 12),
    status: 'draft',
    category: 'Business',
    tags: ['marketing', 'strategy'],
  },
  {
    id: '4',
    title: 'Design System Update',
    date: new Date(2025, 0, 15),
    status: 'scheduled',
    category: 'Design',
    tags: ['design', 'update'],
  },
  {
    id: '5',
    title: 'Case Study: Client Success',
    date: new Date(2025, 0, 18),
    status: 'draft',
    category: 'Business',
    tags: ['case-study'],
  },
  {
    id: '6',
    title: 'Video Tutorial Series',
    date: new Date(2025, 0, 22),
    status: 'scheduled',
    category: 'Technology',
    tags: ['video', 'tutorial'],
  },
  {
    id: '7',
    title: 'Industry News Roundup',
    date: new Date(2025, 0, 25),
    status: 'published',
    category: 'News',
    tags: ['news', 'roundup'],
  },
  {
    id: '8',
    title: 'Product Launch Announcement',
    date: new Date(2025, 0, 28),
    status: 'scheduled',
    category: 'Business',
    tags: ['product', 'announcement'],
  },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  published: 'bg-green-100 text-green-800 border-green-300',
  archived: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-gray-400',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  archived: 'bg-red-500',
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>(DEMO_EVENTS)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const { toast } = useToast()

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear() &&
        (filterStatus === 'all' || event.status === filterStatus) &&
        (filterCategory === 'all' || event.category === filterCategory)
    )
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleEventDrop = (event: CalendarEvent, newDate: Date) => {
    const updatedEvents = events.map((e) =>
      e.id === event.id ? { ...e, date: newDate } : e
    )
    setEvents(updatedEvents)
    toast({
      title: 'Event Rescheduled',
      description: `${event.title} has been moved to ${newDate.toDateString()}`,
    })
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-gray-50 min-h-24 p-2" />
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isToday =
        date.toDateString() === new Date().toDateString()

      days.push(
        <div
          key={day}
          className={`min-h-24 p-2 border ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
          } hover:bg-gray-50 transition-colors`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`text-xs p-1 rounded cursor-pointer truncate border ${STATUS_COLORS[event.status]}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const categories = Array.from(new Set(events.map((e) => e.category)))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-600 mt-1">Plan and visualize your content publishing schedule</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-48 text-center">{monthName}</h2>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${STATUS_DOT_COLORS[status]}`} />
              <span className="text-sm text-gray-600 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                {selectedEvent.date.toDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className={`mt-1 px-3 py-2 rounded border ${STATUS_COLORS[selectedEvent.status]}`}>
                  {selectedEvent.status}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <div className="mt-1 px-3 py-2 rounded border bg-gray-50">
                  {selectedEvent.category}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          {events
            .filter((e) => e.date >= currentDate)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${STATUS_DOT_COLORS[event.status]}`} />
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.date.toDateString()}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                  {event.category}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

