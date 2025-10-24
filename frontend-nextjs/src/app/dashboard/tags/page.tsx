'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Tag {
  id: string
  name: string
  description?: string
  color?: string
  count: number
}

// Demo data
const DEMO_TAGS: Tag[] = [
  { id: '1', name: 'urgent', description: 'High priority content', color: '#EF4444', count: 12 },
  { id: '2', name: 'featured', description: 'Featured content', color: '#F59E0B', count: 8 },
  { id: '3', name: 'trending', description: 'Trending topics', color: '#10B981', count: 15 },
  { id: '4', name: 'tutorial', description: 'How-to guides', color: '#3B82F6', count: 22 },
  { id: '5', name: 'case-study', description: 'Case studies', color: '#8B5CF6', count: 6 },
  { id: '6', name: 'news', description: 'News and updates', color: '#06B6D4', count: 18 },
  { id: '7', name: 'opinion', description: 'Opinion pieces', color: '#EC4899', count: 9 },
  { id: '8', name: 'research', description: 'Research articles', color: '#14B8A6', count: 11 },
  { id: '9', name: 'video', description: 'Video content', color: '#F97316', count: 7 },
  { id: '10', name: 'infographic', description: 'Infographics', color: '#06B6D4', count: 5 },
]

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>(DEMO_TAGS)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6',
    },
  })

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      toast({
        title: 'Tag Updated',
        description: `${data.name} has been updated successfully.`,
      })
    } else {
      toast({
        title: 'Tag Created',
        description: `${data.name} has been created successfully.`,
      })
    }
    setIsDialogOpen(false)
    form.reset()
    setEditingId(null)
  }

  const handleEdit = (tag: Tag) => {
    form.reset({
      name: tag.name,
      description: tag.description,
      color: tag.color,
    })
    setEditingId(tag.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setTags(tags.filter(t => t.id !== id))
    toast({
      title: 'Tag Deleted',
      description: 'The tag has been deleted successfully.',
    })
  }

  const toggleTagSelection = (id: string) => {
    const newSelected = new Set(selectedTags)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTags(newSelected)
  }

  const handleBulkDelete = () => {
    setTags(tags.filter(t => !selectedTags.has(t.id)))
    setSelectedTags(new Set())
    toast({
      title: 'Tags Deleted',
      description: `${selectedTags.size} tags have been deleted.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600 mt-1">Manage and organize your content tags</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset()
              setEditingId(null)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update the tag details' : 'Add a new tag to categorize your content'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., tutorial" {...field} />
                      </FormControl>
                      <FormDescription>Use lowercase, no spaces</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" {...field} className="w-20 h-10" />
                          <Input placeholder="#3B82F6" {...field} className="flex-1" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Input
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {selectedTags.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">
            {selectedTags.size} tag(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedTags.has(tag.id)}
                  onChange={() => toggleTagSelection(tag.id)}
                  className="w-4 h-4 rounded"
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: tag.color || '#3B82F6' }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                  {tag.description && (
                    <p className="text-sm text-gray-500">{tag.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-gray-500">{tag.count} items</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(tag)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tag.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tags found</p>
        </div>
      )}
    </div>
  )
}

