'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  color?: string
  count: number
  children?: Category[]
}

// Demo data
const DEMO_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Technology',
    description: 'Tech-related content',
    color: '#3B82F6',
    count: 24,
    children: [
      { id: '1-1', name: 'AI & Machine Learning', parent_id: '1', color: '#8B5CF6', count: 8 },
      { id: '1-2', name: 'Web Development', parent_id: '1', color: '#8B5CF6', count: 12 },
      { id: '1-3', name: 'DevOps', parent_id: '1', color: '#8B5CF6', count: 4 },
    ],
  },
  {
    id: '2',
    name: 'Business',
    description: 'Business and marketing content',
    color: '#10B981',
    count: 18,
    children: [
      { id: '2-1', name: 'Marketing', parent_id: '2', color: '#34D399', count: 10 },
      { id: '2-2', name: 'Sales', parent_id: '2', color: '#34D399', count: 8 },
    ],
  },
  {
    id: '3',
    name: 'Design',
    description: 'Design and UX content',
    color: '#F59E0B',
    count: 12,
  },
  {
    id: '4',
    name: 'Content Marketing',
    description: 'Content strategy and creation',
    color: '#EF4444',
    count: 15,
  },
  {
    id: '5',
    name: 'Education',
    description: 'Educational resources',
    color: '#06B6D4',
    count: 9,
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: '',
      color: '#3B82F6',
    },
  })

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      toast({
        title: 'Category Updated',
        description: `${data.name} has been updated successfully.`,
      })
    } else {
      toast({
        title: 'Category Created',
        description: `${data.name} has been created successfully.`,
      })
    }
    setIsDialogOpen(false)
    form.reset()
    setEditingId(null)
  }

  const handleEdit = (category: Category) => {
    form.reset({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      color: category.color,
    })
    setEditingId(category.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    toast({
      title: 'Category Deleted',
      description: 'The category has been deleted successfully.',
    })
  }

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedIds.has(category.id)

    return (
      <div key={category.id}>
        <div className="flex items-center px-4 py-3 border-b hover:bg-gray-50">
          <div className="flex-1 flex items-center">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="mr-2 w-6" />}
            
            <div
              className="w-4 h-4 rounded mr-3"
              style={{ backgroundColor: category.color || '#3B82F6' }}
            />
            
            <div className="flex-1">
              <p className="font-medium text-gray-900">{category.name}</p>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {category.count} items
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {category.children!.map((child) => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage your content categories and hierarchy</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset()
              setEditingId(null)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Category' : 'Create New Category'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update the category details' : 'Add a new category to organize your content'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Technology" {...field} />
                      </FormControl>
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
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None (Top Level)</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">All Categories ({categories.length})</h2>
        </div>
        <div>
          {categories.map((category) => renderCategoryRow(category))}
        </div>
      </div>
    </div>
  )
}

