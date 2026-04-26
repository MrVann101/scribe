'use client'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function TopBar({ title }: { title: string }) {
  const router = useRouter()
  return (
    <div className="md:hidden flex items-center p-4 border-b border-border bg-bg-surface sticky top-0 z-10">
      <button onClick={() => router.back()} className="mr-4 text-text-secondary hover:text-text-primary">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="font-display text-lg font-medium text-text-primary truncate">{title}</h1>
    </div>
  )
}