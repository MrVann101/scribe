'use client'

// components/layout/Sidebar.tsx
// Desktop sidebar navigation

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plus, BookOpen, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new', label: 'New Session', icon: Plus },
  { href: '/flashcards', label: 'Flashcards', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-surface/30 px-4 py-6 hidden md:flex flex-col">
      {/* Logo */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-white">Scribe</h1>
        <p className="text-xs text-gray-500">AI Study Companion</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>
    </aside>
  )
}

export default Sidebar