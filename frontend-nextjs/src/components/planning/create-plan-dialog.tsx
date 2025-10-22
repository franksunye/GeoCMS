'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, X } from 'lucide-react'

const formSchema = z.object({
  topic: z.string().min(1, '主题不能为空'),
  title: z.string().min(1, '标题不能为空'),
  category: z.string().min(1, '分类不能为空'),
  keywords: z.array(z.string()).min(1, '至少需要一个关键词'),
  tags: z.array(z.string()).min(1, '至少需要一个标签'),
  outline: z.object({
    introduction: z.string().min(1, '引言不能为空'),
    main_points: z.array(z.string()).min(1, '至少需要一个要点'),
    conclusion: z.string().min(1, '结论不能为空'),
  }),
})

type FormValues = z.infer<typeof formSchema>

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [mainPointInput, setMainPointInput] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      title: '',
      category: '',
      keywords: [],
      tags: [],
      outline: {
        introduction: '',
        main_points: [],
        conclusion: '',
      },
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await axios.post('/api/plans', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast({
        title: '创建成功',
        description: '内容策划已成功创建',
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: '创建失败',
        description: error.message || '创建策划时发生错误',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const current = form.getValues('keywords')
      form.setValue('keywords', [...current, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    const current = form.getValues('keywords')
    form.setValue('keywords', current.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (tagInput.trim()) {
      const current = form.getValues('tags')
      form.setValue('tags', [...current, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    const current = form.getValues('tags')
    form.setValue('tags', current.filter((_, i) => i !== index))
  }

  const addMainPoint = () => {
    if (mainPointInput.trim()) {
      const current = form.getValues('outline.main_points')
      form.setValue('outline.main_points', [...current, mainPointInput.trim()])
      setMainPointInput('')
    }
  }

  const removeMainPoint = (index: number) => {
    const current = form.getValues('outline.main_points')
    form.setValue('outline.main_points', current.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          创建策划
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建内容策划</DialogTitle>
          <DialogDescription>
            创建新的内容策划方案
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：GeoCMS 产品发布博客" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主题</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：产品发布" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：产品发布" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords */}
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>关键词</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入关键词"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" onClick={addKeyword} size="sm">
                      添加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-sm bg-blue-100 text-blue-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="ml-1 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入标签"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      添加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-sm bg-green-100 text-green-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-1 hover:text-green-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Outline */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-medium">内容大纲</h3>
              
              <FormField
                control={form.control}
                name="outline.introduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>引言</FormLabel>
                    <FormControl>
                      <Textarea placeholder="介绍内容背景和目的" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outline.main_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>主要要点</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入要点"
                        value={mainPointInput}
                        onChange={(e) => setMainPointInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMainPoint())}
                      />
                      <Button type="button" onClick={addMainPoint} size="sm">
                        添加
                      </Button>
                    </div>
                    <ul className="space-y-2 mt-2">
                      {field.value.map((point, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <span className="flex-1">{index + 1}. {point}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMainPoint(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outline.conclusion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结论</FormLabel>
                    <FormControl>
                      <Textarea placeholder="总结和行动号召" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                创建
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

