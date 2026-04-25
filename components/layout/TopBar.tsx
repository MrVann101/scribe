'use client'

// components/layout/TopBar.tsx
// Mobile top bar with back button and title

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
  className?: string
}

export function TopBar({ title, showBack = true, rightAction, className }: TopBarProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/10 bg-surface/95 px-4 md:hidden',
        className
      )}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-lg p-1 hover:bg-white/5"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold text-white truncate">{title}</h1>
      {rightAction}
    </header>
  )
}

export default TopBar