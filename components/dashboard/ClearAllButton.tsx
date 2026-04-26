'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function ClearAllButton() {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all your sessions and data? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch('/api/sessions/clear', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to clear sessions')
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('An error occurred while clearing sessions.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button 
      variant="danger" 
      onClick={handleClearAll} 
      disabled={isDeleting}
    >
      {isDeleting ? 'Clearing...' : 'Clear All'}
    </Button>
  )
}
