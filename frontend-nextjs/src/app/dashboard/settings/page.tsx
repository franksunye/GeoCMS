'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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

const brandSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  brand_voice: z.string().optional(),
  keywords: z.string().optional(),
  style_guide: z.string().optional(),
})

const aiSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  temperature: z.string(),
  max_tokens: z.string(),
  system_prompt: z.string().optional(),
})

const publishSchema = z.object({
  default_category: z.string().optional(),
  default_status: z.string().optional(),
  publish_channels: z.string().optional(),
})

const systemSchema = z.object({
  language: z.string(),
  timezone: z.string(),
  notifications_enabled: z.string(),
})

type BrandFormValues = z.infer<typeof brandSchema>
type AIFormValues = z.infer<typeof aiSchema>
type PublishFormValues = z.infer<typeof publishSchema>
type SystemFormValues = z.infer<typeof systemSchema>

export default function SettingsPage() {
  const { toast } = useToast()

  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      brand_name: 'GeoCMS',
      brand_voice: 'Professional, informative, and engaging',
      keywords: 'content management, geo-location, AI-powered',
      style_guide: 'Use clear, concise language. Maintain consistent tone across all content.',
    },
  })

  const aiForm = useForm<AIFormValues>({
    resolver: zodResolver(aiSchema),
    defaultValues: {
      model: 'gpt-4',
      temperature: '0.7',
      max_tokens: '2000',
      system_prompt: 'You are a professional content writer...',
    },
  })

  const publishForm = useForm<PublishFormValues>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      default_category: 'technology',
      default_status: 'draft',
      publish_channels: 'blog, social-media',
    },
  })

  const systemForm = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      language: 'en',
      timezone: 'UTC',
      notifications_enabled: 'true',
    },
  })

  const onBrandSubmit = (data: BrandFormValues) => {
    toast({
      title: 'Brand Settings Saved',
      description: 'Your brand settings have been updated successfully.',
    })
  }

  const onAISubmit = (data: AIFormValues) => {
    toast({
      title: 'AI Settings Saved',
      description: 'Your AI configuration has been updated successfully.',
    })
  }

  const onPublishSubmit = (data: PublishFormValues) => {
    toast({
      title: 'Publishing Settings Saved',
      description: 'Your publishing settings have been updated successfully.',
    })
  }

  const onSystemSubmit = (data: SystemFormValues) => {
    toast({
      title: 'System Settings Saved',
      description: 'Your system settings have been updated successfully.',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your system configuration and preferences</p>
      </div>

      <Tabs defaultValue="brand" className="bg-white rounded-lg shadow">
        <TabsList className="w-full justify-start border-b rounded-none bg-gray-50 p-0">
          <TabsTrigger value="brand" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            Brand Settings
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            AI Configuration
          </TabsTrigger>
          <TabsTrigger value="publish" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            Publishing
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="p-6">
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(onBrandSubmit)} className="space-y-6">
              <FormField
                control={brandForm.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={brandForm.control}
                name="brand_voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Voice</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your brand voice..." {...field} />
                    </FormControl>
                    <FormDescription>
                      How should your content sound? (tone, style, personality)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={brandForm.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="Comma-separated keywords..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Key terms that define your brand
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={brandForm.control}
                name="style_guide"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style Guide</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your style guidelines..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Writing style, formatting rules, and best practices
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Brand Settings
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="ai" className="p-6">
          <Form {...aiForm}>
            <form onSubmit={aiForm.handleSubmit(onAISubmit)} className="space-y-6">
              <FormField
                control={aiForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={aiForm.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (0-1)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Higher values make output more creative, lower values more deterministic
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={aiForm.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum length of generated content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={aiForm.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="System prompt for AI..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Instructions for the AI model
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save AI Settings
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="publish" className="p-6">
          <Form {...publishForm}>
            <form onSubmit={publishForm.handleSubmit(onPublishSubmit)} className="space-y-6">
              <FormField
                control={publishForm.control}
                name="default_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={publishForm.control}
                name="default_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={publishForm.control}
                name="publish_channels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Channels</FormLabel>
                    <FormControl>
                      <Input placeholder="Comma-separated channels..." {...field} />
                    </FormControl>
                    <FormDescription>
                      e.g., blog, social-media, newsletter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Publishing Settings
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="system" className="p-6">
          <Form {...systemForm}>
            <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
              <FormField
                control={systemForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={systemForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="CST">Central Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={systemForm.control}
                name="notifications_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notifications</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

