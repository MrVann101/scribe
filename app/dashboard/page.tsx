import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { Mic, FileText, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { source?: string }
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const sourceFilter = searchParams.source

  let query = supabase.from('session_with_summary_status').select('*').order('created_at', { ascending: false })
  
  if (sourceFilter === 'recording' || sourceFilter === 'pdf') {
    query = query.eq('source', sourceFilter)
  }

  const { data: sessions } = await query

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <TopBar title="Dashboard" />
        
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary">Welcome back</h1>
              <p className="text-text-secondary mt-1">Ready to master your next topic?</p>
            </div>
            <Link href="/new">
              <Button className="w-full md:w-auto">New Session</Button>
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
            <Link href="/dashboard">
              <Button variant={!sourceFilter ? 'primary' : 'secondary'} size="sm" className="rounded-full">
                All Activity
              </Button>
            </Link>
            <Link href="/dashboard?source=recording">
              <Button variant={sourceFilter === 'recording' ? 'primary' : 'secondary'} size="sm" className="rounded-full">
                Recordings
              </Button>
            </Link>
            <Link href="/dashboard?source=pdf">
              <Button variant={sourceFilter === 'pdf' ? 'primary' : 'secondary'} size="sm" className="rounded-full">
                PDFs
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions && sessions.length > 0 ? (
              sessions.map((session) => (
                <Card key={session.id} className="flex flex-col h-full hover:border-border-subtle transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={session.source}>
                      {session.source === 'recording' ? (
                        <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Audio</span>
                      ) : (
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>
                      )}
                    </Badge>
                    <Badge variant={session.status}>
                      {session.status}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary text-lg line-clamp-2">{session.title}</h3>
                    {session.subject && (
                      <p className="text-sm text-accent-violet mt-1">{session.subject}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">{formatDate(session.created_at)}</span>
                    <Link href={`/session/${session.id}`}>
                      <Button variant="ghost" size="sm" className="h-8">View Study Guide</Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState 
                  icon={<BookOpen className="h-12 w-12" />}
                  title="No sessions found"
                  description={sourceFilter ? `You don't have any ${sourceFilter} sessions yet.` : "Get started by recording a lecture or uploading a PDF."}
                  action={
                    <Link href="/new">
                      <Button>Create your first session</Button>
                    </Link>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
