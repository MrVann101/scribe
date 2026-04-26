import Link from 'next/link'
import { LayoutDashboard, PlusCircle, Trash2 } from 'lucide-react'
import { LogoutButton } from './LogoutButton'

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border flex justify-around p-3 pb-safe z-50">
      <Link href="/dashboard" className="flex flex-col items-center text-text-secondary hover:text-text-primary">
        <LayoutDashboard className="h-6 w-6 mb-1" />
        <span className="text-xs">Dashboard</span>
      </Link>
      <Link href="/new" className="flex flex-col items-center text-text-secondary hover:text-text-primary">
        <PlusCircle className="h-6 w-6 mb-1" />
        <span className="text-xs">New</span>
      </Link>
      <Link href="/trash" className="flex flex-col items-center text-text-secondary hover:text-text-primary">
        <Trash2 className="h-6 w-6 mb-1" />
        <span className="text-xs">Trash</span>
      </Link>
      <LogoutButton variant="bottom" />
    </div>
  )
}