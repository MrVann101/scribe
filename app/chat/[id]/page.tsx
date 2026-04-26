import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { EmptyState } from '@/components/ui/EmptyState'
import { redirect } from 'next/navigation'

export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('title, subject, source')
    .eq('id', params.id)
    .single()

  if (sessionError || !session) {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Session Not Found" />
          <EmptyState title="Session Not Found" description="The session you're looking for doesn't exist." />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden pb-16 md:pb-0">
        <TopBar title={`Chat: ${session.title}`} />
        
        <div className="flex flex-1 overflow-hidden p-4 md:p-8 gap-6 max-w-7xl mx-auto w-full">
          {/* Left panel context (Desktop only) */}
          <div className="hidden lg:flex w-80 flex-col gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-text-primary">{session.title}</h2>
              {session.subject && <p className="text-accent-violet mt-1">{session.subject}</p>}
            </div>
            <div className="bg-bg-surface border border-border rounded-xl p-4 mt-4 text-sm text-text-secondary leading-relaxed">
              <p>
                <strong>AI Chat Assistant</strong><br/><br/>
                I&apos;m here to help you study this {session.source}. You can ask me to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Explain concepts in simpler terms</li>
                <li>Provide more examples</li>
                <li>Translate parts into Bisaya</li>
                <li>Quiz you on specific topics</li>
              </ul>
            </div>
          </div>

          {/* Right panel Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatContainer sessionId={params.id} />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}