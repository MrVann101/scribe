import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { BentoGrid } from '@/components/session/BentoGrid'
import { OverviewCard } from '@/components/session/OverviewCard'
import { ConceptsCard } from '@/components/session/ConceptsCard'
import { QuizCard } from '@/components/session/QuizCard'
import { FlashcardDeck } from '@/components/session/FlashcardDeck'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { SessionTabs } from './SessionTabs'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function SessionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
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

  if (session.status !== 'done') {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <TopBar title={session.title} />
          <div className="p-4 md:p-8 flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
            <Loader2 className="h-12 w-12 text-accent-blue animate-spin mb-4" />
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">Generating Study Guide</h2>
            <p className="text-text-secondary">Please wait while our AI processes your {session.source}. This usually takes a few seconds.</p>
            <meta httpEquiv="refresh" content="5" />
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const { data: summary } = await supabase
    .from('summaries')
    .select('*')
    .eq('session_id', params.id)
    .single()

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <TopBar title={session.title} />
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-text-primary">{session.title}</h1>
            <Badge variant={session.source}>{session.source === 'recording' ? 'Audio' : 'PDF'}</Badge>
          </div>
          {session.subject && <p className="text-accent-violet font-medium">{session.subject}</p>}

          {!summary ? (
            <EmptyState title="No Summary Found" description="There was an issue generating the summary for this session." />
          ) : (
            <SessionTabs 
              summaryContent={
                <BentoGrid>
                  <OverviewCard overview={summary.overview} actionItems={summary.action_items} />
                  <ConceptsCard concepts={summary.key_concepts} />
                </BentoGrid>
              }
              flashcardsContent={
                <div className="max-w-2xl mx-auto">
                  <FlashcardDeck cards={summary.flashcards} />
                </div>
              }
              quizContent={
                <div className="max-w-2xl mx-auto">
                  <QuizCard questions={summary.quiz} />
                </div>
              }
              chatContent={
                <div className="max-w-4xl mx-auto">
                  <ChatContainer sessionId={params.id} />
                </div>
              }
            />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}