// components/ui/Badge.tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, FileText, Mic, CheckCircle, AlertTriangle, XCircle, Bot } from 'lucide-react'

interface BadgeProps {
  variant?: 'recording' | 'pdf' | 'done' | 'processing' | 'error' | 'alert' | 'ai'
  children: ReactNode
  className?: string
}

const variantStyles = {
  recording: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  pdf: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  done: 'bg-green-600/20 text-green-400 border-green-600/30',
  processing: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  error: 'bg-red-600/20 text-red-400 border-red-600/30',
  alert: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  ai: 'bg-violet-600/20 text-violet-400 border-violet-600/30',
}

const variantIcons = {
  recording: Mic,
  pdf: FileText,
  done: CheckCircle,
  processing: Loader2,
  error: XCircle,
  alert: AlertTriangle,
  ai: Bot,
}

export function Badge({ variant = 'ai', children, className }: BadgeProps) {
  const Icon = variantIcons[variant]
  const isProcessing = variant === 'processing'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className={isProcessing ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />}
      {children}
    </span>
  )
}

export default Badge