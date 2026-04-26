import Link from 'next/link'
import { PlusCircle, LayoutDashboard, User } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="hidden md:flex w-64 flex-col bg-bg-surface border-r border-border h-screen p-4 sticky top-0">
      <div className="mb-8 px-4 font-display text-2xl font-bold text-text-primary">
        Scribe
      </div>
      <nav className="flex-1 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-4 py-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary">
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/new" className="flex items-center gap-3 rounded-lg px-4 py-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary">
          <PlusCircle className="h-5 w-5" />
          New Session
        </Link>
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary cursor-pointer">
          <User className="h-5 w-5" />
          Profile
        </div>
      </div>
    </div>
  )
}