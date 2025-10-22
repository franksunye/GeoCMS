'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Knowledge } from '@/types'

interface DeleteKnowledgeDialogProps {
  knowledge: Knowledge | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteKnowledgeDialog({
  knowledge,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteKnowledgeDialogProps) {
  if (!knowledge) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除知识 <strong>&ldquo;{knowledge.topic}&rdquo;</strong> 吗？
            此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? '删除中...' : '删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

