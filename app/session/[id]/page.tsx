// app/session/[id]/page.tsx
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
import { ProcessingPoller } from '@/components/session/ProcessingPoller'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function SessionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // ─── Auth check ───
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ─── Fetch session ───
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id) // FIX 1: verify ownership so other users can't view your session
    .single()

  // ─── Session not found ───
  if (sessionError || !session) {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Session Not Found" />
          <EmptyState
            title="Session Not Found"
            description="This session doesn't exist or you don't have access to it."
          />
        </main>
        <BottomNav />
      </div>
    )
  }

  // ─── Still processing ───
  // FIX 2: Removed <meta httpEquiv="refresh"> — it was losing auth cookies on reload
  // Replaced with ProcessingPoller — a client component that polls /api/sessions/[id]
  // every 3 seconds and calls router.refresh() when status becomes 'done'
  if (session.status === 'processing' || session.status === 'recording') {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <TopBar title={session.title} />
          <div className="p-4 md:p-8 flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
            <Loader2 className="h-12 w-12 text-accent-blue animate-spin mb-4" />
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
              Generating Study Guide
            </h2>
            <p className="text-text-secondary max-w-sm">
              Our AI is processing your{' '}
              {session.source === 'pdf' ? 'PDF' : 'recording'}.
              This usually takes 10–20 seconds.
            </p>
            <p className="text-text-muted text-sm mt-2">
              Stay on this page — it will update automatically.
            </p>

            {/* FIX 2: ProcessingPoller replaces <meta httpEquiv="refresh"> */}
            {/* Polls silently in background, uses router.refresh() not window.location */}
            <ProcessingPoller sessionId={params.id} intervalMs={3000} />
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ─── Error state ───
  if (session.status === 'error') {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <TopBar title={session.title} />
          <div className="p-4 md:p-8 flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
            <div className="h-12 w-12 rounded-full bg-danger/20 flex items-center justify-center mb-4">
              <span className="text-danger text-2xl">!</span>
            </div>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
              Generation Failed
            </h2>
            <p className="text-text-secondary max-w-sm">
              There was an error generating your study guide. This is usually caused by
              an API quota limit. Try again with a new Gemini API key.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ─── Done — fetch summary ───
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
          {/* Session header */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl font-bold text-text-primary">
              {session.title}
            </h1>
            <Badge variant={session.source}>
              {session.source === 'recording' ? '🎙️ Audio' : '📄 PDF'}
            </Badge>
          </div>
          {session.subject && (
            <p className="text-accent-violet font-medium">{session.subject}</p>
          )}

          {/* Study guide content */}
          {!summary ? (
            <EmptyState
              title="No Summary Found"
              description="There was an issue generating the summary. Please try deleting and re-creating this session."
            />
          ) : (
            <SessionTabs
              summaryContent={
                <BentoGrid>
                  <OverviewCard
                    overview={summary.overview}
                    actionItems={summary.action_items}
                  />
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
              overview={summary.overview}
              keyConcepts={summary.key_concepts}
              actionItems={summary.action_items}
              quiz={summary.quiz}
              sessionId={params.id}
            />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}