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
  topic: z.string().min(1, 'Topic cannot be empty').max(100, 'Topic cannot exceed 100 characters'),
  content: z.string().min(1, 'Content cannot be empty'),
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
        throw new Error('Content must be valid JSON format')
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
        title: 'Updated Successfully',
        description: 'Knowledge has been successfully updated',
      })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating knowledge',
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
          <DialogTitle>Edit Knowledge</DialogTitle>
          <DialogDescription>
            Modify knowledge content. Content must be in valid JSON format.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., company_info" {...field} />
                  </FormControl>
                  <FormDescription>
                    Topic or category identifier for the knowledge
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
                  <FormLabel>Content (JSON Format)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"name": "Company Name", "description": "Company Description"}'
                      className="font-mono text-sm min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific content of the knowledge, must be in valid JSON format
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
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

