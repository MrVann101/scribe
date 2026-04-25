'use client'

// components/layout/BottomNav.tsx
// Mobile bottom tab bar

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plus, BookOpen, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/new', label: 'New', icon: Plus },
  { href: '/flashcards', label: 'Study', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-surface/95 px-2 py-2 md:hidden flex justify-around items-center h-16">
      {navItems.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-colors',
              isActive ? 'text-blue-400' : 'text-gray-500'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomNav