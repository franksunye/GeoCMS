'use client'

import { useState } from 'react'
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
import { Plus, Loader2 } from 'lucide-react'

const formSchema = z.object({
  topic: z.string().min(1, '主题不能为空').max(100, '主题不能超过100个字符'),
  content: z.string().min(1, '内容不能为空'),
})

type FormValues = z.infer<typeof formSchema>

export function AddKnowledgeDialog() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      content: '{}',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      let parsedContent
      try {
        parsedContent = JSON.parse(data.content)
      } catch (e) {
        throw new Error('内容必须是有效的 JSON 格式')
      }

      const response = await axios.post('/api/knowledge', {
        topic: data.topic,
        content: parsedContent,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      toast({
        title: '添加成功',
        description: '知识已成功添加到知识库',
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: '添加失败',
        description: error.message || '添加知识时发生错误',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加知识
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>添加知识</DialogTitle>
          <DialogDescription>
            添加新的知识到知识库。内容需要是有效的 JSON 格式。
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
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                添加
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

