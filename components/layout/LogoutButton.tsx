'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton({ variant = 'sidebar' }: { variant?: 'sidebar' | 'bottom' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  if (variant === 'bottom') {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex flex-col items-center text-text-secondary hover:text-danger disabled:opacity-50"
      >
        <LogOut className="h-6 w-6 mb-1" />
        <span className="text-xs">Logout</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-3 rounded-lg px-4 py-2 w-full text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-50"
    >
      <LogOut className="h-5 w-5" />
      {loading ? 'Signing out...' : 'Log Out'}
    </button>
  )
}
