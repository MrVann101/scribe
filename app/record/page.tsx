'use client'

// app/record/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/Input'
import { MicButton } from '@/components/record/MicButton'
import { TranscriptViewer, TranscriptChunk } from '@/components/record/TranscriptViewer'
import { useWebSpeech } from '@/hooks/useWebSpeech'
import { SaveTranscriptChunkRequest } from '@/types/api'

export default function RecordPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [chunks, setChunks] = useState<TranscriptChunk[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const chunkIndexRef = useRef(0)

  // FIX 1: Guard against React 18 StrictMode double-firing useEffect
  // Without this, two sessions get created every time you open the record page
  const sessionCreatedRef = useRef(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router, supabase.auth])

  const { isRecording, isConnecting, error, startRecording, stopRecording } = useWebSpeech({
    onTranscript: (text) => {
      const newChunk: TranscriptChunk = {
        text,
        isAlert: text.includes('<alert>'),
        topicLabel: undefined,
      }
      setChunks((prev) => [...prev, newChunk])

      const currentIndex = chunkIndexRef.current
      chunkIndexRef.current += 1

      if (sessionId) {
        fetch('/api/transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            chunk_index: currentIndex,
            text,
            is_alert: text.includes('<alert>'),
            topic_label: undefined,
            source: 'recording',
          } as SaveTranscriptChunkRequest),
        }).catch(console.error)
      }
    },
  })

  // Create session on mount — with StrictMode guard
  useEffect(() => {
    // FIX 2: This ref prevents the double-create in React 18 StrictMode dev mode
    // StrictMode mounts → unmounts → remounts, firing useEffect twice
    // The ref persists across the unmount/remount cycle, blocking the second call
    if (sessionCreatedRef.current) return
    sessionCreatedRef.current = true

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Recording', source: 'recording' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setSessionId(data.id)
          console.log('[Scribe] Recording session created:', data.id)
        }
      })
      .catch(console.error)
  }, [])

  const handleStart = async () => {
    if (!sessionId) {
      console.warn('[Scribe] Cannot start — no session ID yet')
      return
    }
    await startRecording()
  }

  const handleStop = async () => {
    stopRecording()
    setIsProcessing(true)

    // Update session title if user entered one
    if (sessionId) {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'New Recording',
          subject: subject.trim() || null,
        }),
      }).catch(console.error)
    }

    // Fire-and-forget — kick off summarization in background
    // Do NOT await this — redirect immediately so user sees loading state
    if (sessionId) {
      fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(console.error)
    }

    // Redirect immediately — ProcessingPoller on session page handles the rest
    router.push(`/session/${sessionId}`)
  }

  let state: 'idle' | 'connecting' | 'recording' | 'processing' = 'idle'
  if (isConnecting) state = 'connecting'
  if (isRecording) state = 'recording'
  if (isProcessing) state = 'processing'

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <TopBar title="Record Lecture" />

      <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 overflow-hidden">
        <div className="space-y-4 mb-8 shrink-0">
          <Input
            placeholder="Lecture Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium bg-transparent border-none px-0 focus-visible:ring-0 text-text-primary placeholder:text-text-muted"
          />
          <Input
            placeholder="Subject (Optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm bg-transparent border-none px-0 focus-visible:ring-0 text-text-secondary placeholder:text-text-muted"
          />
        </div>

        <div className="flex-1 min-h-0 relative bg-bg-elevated/30 rounded-xl border border-border overflow-hidden p-4">
          <TranscriptViewer chunks={chunks} />
        </div>

        <div className="mt-8 flex flex-col items-center justify-center shrink-0">
          <MicButton
            state={state}
            onClick={state === 'recording' ? handleStop : handleStart}
          />
          <div className="mt-4 text-center">
            {state === 'idle' && !sessionId && (
              <p className="text-text-muted text-sm">Setting up session...</p>
            )}
            {state === 'idle' && sessionId && (
              <p className="text-text-muted text-sm">Tap the mic to start recording</p>
            )}
            {state === 'connecting' && (
              <p className="text-text-secondary text-sm animate-pulse">Connecting...</p>
            )}
            {state === 'recording' && (
              <p className="text-accent-blue font-medium animate-pulse">
                Recording &amp; Transcribing...
              </p>
            )}
            {state === 'processing' && (
              <p className="text-warning font-medium animate-pulse">
                Generating Study Guide...
              </p>
            )}
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}