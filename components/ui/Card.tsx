// components/ui/Card.tsx
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-white/10 bg-surface/50 p-4',
          className
        )}
        {...props}
      />
    )
    
  }
)

Card.displayName = 'Card'

export default Card