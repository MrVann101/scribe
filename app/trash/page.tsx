'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Trash2, RotateCcw, Mic, FileText, AlertTriangle } from 'lucide-react'

interface TrashedSession {
  id: string
  title: string
  source: string
  status: string
  subject: string | null
  deleted_at: string
  created_at: string
}

export default function TrashPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<TrashedSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrash = async () => {
    try {
      const res = await fetch('/api/sessions/trash')
      const data = await res.json()
      setSessions(data || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchTrash() }, [])

  const handleRestore = async (id: string) => {
    await fetch(`/api/sessions/${id}/restore`, { method: 'POST' })
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this session? This cannot be undone.')) return
    await fetch(`/api/sessions/${id}?permanent=true`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const handleEmptyTrash = async () => {
    if (!confirm('Permanently delete ALL trashed sessions? This cannot be undone.')) return
    await Promise.all(sessions.map(s => 
      fetch(`/api/sessions/${s.id}?permanent=true`, { method: 'DELETE' })
    ))
    setSessions([])
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <TopBar title="Trash" />
        
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary">Trash</h1>
              <p className="text-text-secondary mt-1">
                {sessions.length > 0 
                  ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} in trash`
                  : 'No sessions in trash'
                }
              </p>
            </div>
            {sessions.length > 0 && (
              <Button variant="danger" onClick={handleEmptyTrash} icon={<Trash2 className="h-4 w-4" />}>
                Empty Trash
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <Card key={session.id} className="flex flex-col h-full opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={session.source as 'recording' | 'pdf'}>
                      {session.source === 'recording' ? (
                        <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Audio</span>
                      ) : (
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary text-lg line-clamp-2">{session.title}</h3>
                    {session.subject && (
                      <p className="text-sm text-accent-violet mt-1">{session.subject}</p>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      Deleted {formatDate(session.deleted_at)}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 justify-end">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleRestore(session.id)}
                      icon={<RotateCcw className="h-3.5 w-3.5" />}
                    >
                      Restore
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handlePermanentDelete(session.id)}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={<Trash2 className="h-12 w-12" />}
              title="Trash is empty"
              description="Deleted sessions will appear here. You can restore them or permanently delete them."
            />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
