import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bg-bg-surface border border-border rounded-xl p-6 shadow-sm", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'