/**
 * 乐观更新Hook
 * 在API请求完成前立即更新UI，提供更流畅的用户体验
 */

import { useQueryClient, useMutation, UseMutationOptions } from '@tanstack/react-query'
import { useToast } from './use-toast'

interface OptimisticUpdateOptions<TData, TVariables, TContext = unknown> {
  queryKey: any[]
  mutationFn: (variables: TVariables) => Promise<TData>
  updateFn: (oldData: any, variables: TVariables) => any
  successMessage?: string
  errorMessage?: string
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: TContext | undefined) => void
}

/**
 * 使用乐观更新的Mutation Hook
 */
export function useOptimisticUpdate<TData = unknown, TVariables = unknown, TContext = unknown>({
  queryKey,
  mutationFn,
  updateFn,
  successMessage,
  errorMessage,
  onMutate: userOnMutate,
  onSuccess: userOnSuccess,
  onError: userOnError,
  onSettled: userOnSettled,
}: OptimisticUpdateOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<TData, Error, TVariables, { previousData: any; userContext?: TContext }>({
    mutationFn,

    // 在mutation开始前
    onMutate: async (variables) => {
      // 取消所有正在进行的查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey })

      // 保存当前数据快照
      const previousData = queryClient.getQueryData(queryKey)

      // 乐观更新缓存
      queryClient.setQueryData(queryKey, (old: any) => {
        return updateFn(old, variables)
      })

      // 调用用户提供的onMutate
      let userContext: TContext | undefined
      if (userOnMutate) {
        userContext = await userOnMutate(variables)
      }

      // 返回上下文对象，包含快照数据
      return { previousData, userContext }
    },

    // 如果mutation失败，回滚到之前的数据
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      // 显示错误提示
      toast({
        title: '操作失败',
        description: errorMessage || error.message,
        variant: 'destructive',
      })

      // 调用用户提供的onError
      if (userOnError && context?.userContext) {
        userOnError(error, variables, context.userContext)
      }
    },

    // mutation成功后
    onSuccess: (data, variables, context) => {
      // 显示成功提示
      if (successMessage) {
        toast({
          title: '操作成功',
          description: successMessage,
        })
      }

      // 调用用户提供的onSuccess
      if (userOnSuccess && context?.userContext) {
        userOnSuccess(data, variables, context.userContext)
      }
    },

    // 无论成功还是失败，都重新获取数据以确保同步
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey })

      // 调用用户提供的onSettled
      if (userOnSettled && context?.userContext) {
        userOnSettled(data, error || null, variables, context.userContext)
      }
    },
  })
}

/**
 * 列表项更新的乐观更新
 */
export function useOptimisticListUpdate<TItem extends { id: number | string }>(
  queryKey: any[],
  mutationFn: (variables: { id: number | string; data: Partial<TItem> }) => Promise<TItem>
) {
  return useOptimisticUpdate<TItem, { id: number | string; data: Partial<TItem> }>({
    queryKey,
    mutationFn,
    updateFn: (oldData: TItem[] | undefined, variables) => {
      if (!oldData) return oldData

      return oldData.map((item) =>
        item.id === variables.id
          ? { ...item, ...variables.data }
          : item
      )
    },
    successMessage: '更新成功',
    errorMessage: '更新失败，请重试',
  })
}

/**
 * 列表项删除的乐观更新
 */
export function useOptimisticListDelete<TItem extends { id: number | string }>(
  queryKey: any[],
  mutationFn: (id: number | string) => Promise<void>
) {
  return useOptimisticUpdate<void, number | string>({
    queryKey,
    mutationFn,
    updateFn: (oldData: TItem[] | undefined, id) => {
      if (!oldData) return oldData
      return oldData.filter((item) => item.id !== id)
    },
    successMessage: '删除成功',
    errorMessage: '删除失败，请重试',
  })
}

/**
 * 列表项添加的乐观更新
 */
export function useOptimisticListAdd<TItem>(
  queryKey: any[],
  mutationFn: (data: Omit<TItem, 'id'>) => Promise<TItem>
) {
  return useOptimisticUpdate<TItem, Omit<TItem, 'id'>>({
    queryKey,
    mutationFn,
    updateFn: (oldData: TItem[] | undefined, newItem) => {
      if (!oldData) return [newItem as TItem]
      
      // 为新项生成临时ID
      const tempItem = {
        ...newItem,
        id: `temp-${Date.now()}`,
      } as TItem

      return [...oldData, tempItem]
    },
    successMessage: '添加成功',
    errorMessage: '添加失败，请重试',
  })
}

/**
 * 单个对象更新的乐观更新
 */
export function useOptimisticObjectUpdate<TData>(
  queryKey: any[],
  mutationFn: (data: Partial<TData>) => Promise<TData>
) {
  return useOptimisticUpdate<TData, Partial<TData>>({
    queryKey,
    mutationFn,
    updateFn: (oldData: TData | undefined, updates) => {
      if (!oldData) return oldData
      return { ...oldData, ...updates }
    },
    successMessage: '更新成功',
    errorMessage: '更新失败，请重试',
  })
}

