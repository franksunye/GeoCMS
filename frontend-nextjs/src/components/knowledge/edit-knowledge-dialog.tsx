'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Loader2 } from 'lucide-react'
import { Knowledge } from '@/types'

const formSchema = z.object({
  topic: z.string().min(1, '主题不能为空').max(100, '主题不能超过100个字符'),
  content: z.string().min(1, '内容不能为空'),
})

type FormValues = z.infer<typeof formSchema>

interface EditKnowledgeDialogProps {
  knowledge: Knowledge
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditKnowledgeDialog({
  knowledge,
  open,
  onOpenChange,
}: EditKnowledgeDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: knowledge.topic,
      content: JSON.stringify(knowledge.content, null, 2),
    },
  })

  // Update form when knowledge changes
  useEffect(() => {
    form.reset({
      topic: knowledge.topic,
      content: JSON.stringify(knowledge.content, null, 2),
    })
  }, [knowledge, form])

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      let parsedContent
      try {
        parsedContent = JSON.parse(data.content)
      } catch (e) {
        throw new Error('内容必须是有效的 JSON 格式')
      }

      const response = await axios.put(`/api/knowledge/${knowledge.id}`, {
        topic: data.topic,
        content: parsedContent,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      toast({
        title: '更新成功',
        description: '知识已成功更新',
      })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: '更新失败',
        description: error.message || '更新知识时发生错误',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑知识</DialogTitle>
          <DialogDescription>
            修改知识内容。内容需要是有效的 JSON 格式。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主题</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：company_info" {...field} />
                  </FormControl>
                  <FormDescription>
                    知识的主题或分类标识
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容（JSON 格式）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"name": "公司名称", "description": "公司描述"}'
                      className="font-mono text-sm min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    知识的具体内容，必须是有效的 JSON 格式
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

