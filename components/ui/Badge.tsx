import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

interface BadgeProps {
  variant?: 'recording' | 'pdf' | 'done' | 'processing' | 'error' | 'alert' | 'ai'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'done', children, className }: BadgeProps) {
  const variants = {
    recording: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20',
    pdf: 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20',
    done: 'bg-success/10 text-success border border-success/20',
    processing: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-danger/10 text-danger border border-danger/20',
    alert: 'bg-warning/10 text-warning border border-warning/20',
    ai: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {variant === 'processing' && <Spinner className="mr-1.5 h-3 w-3" />}
      {children}
    </span>
  )
}