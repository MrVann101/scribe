// components/ui/EmptyState.tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { FileQuestion } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {icon || <FileQuestion className="h-12 w-12 text-gray-600 mb-4" />}
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}

export default EmptyState