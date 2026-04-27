'use client'

// components/dashboard/DeleteButton.tsx
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export function DeleteButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // FIX 1: Changed confirm text to be honest — this permanently deletes
    if (!confirm('Permanently delete this session? This cannot be undone.')) return

    setLoading(true)
    try {
      // FIX 2: Added ?permanent=true so DELETE route skips soft-delete
      // and does an actual DELETE instead of trying to set deleted_at
      const res = await fetch(`/api/sessions/${sessionId}?permanent=true`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }

      router.refresh()
    } catch (err) {
      console.error('[Scribe] Delete error:', err)
      alert('Failed to delete session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
      title="Delete session"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}