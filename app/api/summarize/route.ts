// app/api/summarize/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini'
import { SUMMARIZER_PROMPT, FLASHCARD_PROMPT } from '@/lib/prompts'
import { SummarizeRequest } from '@/types/api'

// FIX 1: Hard cap on transcript length sent to Gemini
// A 1-hour lecture is ~8000 words — 12000 chars is plenty for a good summary
const MAX_TRANSCRIPT_CHARS = 12000

// FIX 2: Wrap any promise with a timeout so Gemini never hangs forever
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout])
}

export async function POST(request: Request) {
  const startTime = Date.now()
  const adminClient = createAdminClient()

  try {
    const body: SummarizeRequest = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    console.log(`[Scribe] Starting summarize for session: ${session_id}`)

    // ─── 1. Fetch transcript chunks ───
    const { data: chunks, error: chunksError } = await adminClient
      .from('transcripts')
      .select('text, chunk_index')
      .eq('session_id', session_id)
      .order('chunk_index', { ascending: true })

    if (chunksError) throw new Error(`Transcript fetch failed: ${chunksError.message}`)
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No transcript data found' }, { status: 400 })
    }

    // ─── 2. Build and truncate text ───
    const fullText = chunks.map((c) => c.text).join('\n\n')

    // FIX 3: Truncate long transcripts — speeds up Gemini significantly
    const text = fullText.length > MAX_TRANSCRIPT_CHARS
      ? fullText.slice(0, MAX_TRANSCRIPT_CHARS) + '\n\n[Content truncated for processing]'
      : fullText

    console.log(`[Scribe] Transcript: ${fullText.length} chars → sending ${text.length} chars`)

    // ─── 3. Call Gemini in parallel with timeout ───
    // FIX 4: 45 second timeout per call — prevents infinite hangs
    const [summaryStr, flashcardsStr] = await Promise.all([
      withTimeout(callGemini(SUMMARIZER_PROMPT, text), 45000, 'Summary'),
      withTimeout(callGemini(FLASHCARD_PROMPT, text), 45000, 'Flashcards'),
    ])

    // ─── 4. Parse JSON safely ───
    let summary: Record<string, unknown>
    let flashcards: unknown[]

    try {
      summary = JSON.parse(summaryStr)
    } catch {
      // FIX 5: If Gemini wraps in code fences despite instructions, strip and retry
      const cleaned = summaryStr
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim()
      summary = JSON.parse(cleaned)
    }

    try {
      flashcards = JSON.parse(flashcardsStr)
    } catch {
      const cleaned = flashcardsStr
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim()
      flashcards = JSON.parse(cleaned)
    }

    // ─── 5. Upsert to summaries table ───
    const { error: upsertError } = await adminClient
      .from('summaries')
      .upsert(
        {
          session_id,
          overview: summary.overview ?? null,
          key_concepts: summary.key_concepts ?? [],
          action_items: summary.action_items ?? [],
          quiz: summary.quiz ?? [],
          flashcards: flashcards ?? [],
        },
        { onConflict: 'session_id' }
      )

    if (upsertError) throw new Error(`Summary save failed: ${upsertError.message}`)

    // ─── 6. Mark session as done ───
    const { error: updateError } = await adminClient
      .from('sessions')
      .update({ status: 'done' })
      .eq('id', session_id)

    if (updateError) throw new Error(`Session update failed: ${updateError.message}`)

    const elapsed = Date.now() - startTime
    console.log(`[Scribe] Summarize complete in ${elapsed}ms for session: ${session_id}`)

    return NextResponse.json({ ok: true, session_id, elapsed_ms: elapsed })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('[Scribe] Summarize error:', message)

    // FIX 6: Mark session as error so UI doesn't show infinite loading
    try {
      const body: SummarizeRequest = await request.json().catch(() => ({ session_id: '' }))
      if (body.session_id) {
        await adminClient
          .from('sessions')
          .update({ status: 'error' })
          .eq('id', body.session_id)
      }
    } catch { /* ignore secondary error */ }

    // FIX 7: Specific quota error response
    if (message.includes('429') || message.includes('QUOTA') || message.includes('quota')) {
      return NextResponse.json({
        error: 'Gemini quota exceeded. Please use a new API key or wait a minute.',
        code: 'QUOTA_EXCEEDED',
      }, { status: 429 })
    }

    if (message.includes('timed out')) {
      return NextResponse.json({
        error: 'Gemini took too long to respond. Please try again.',
        code: 'TIMEOUT',
      }, { status: 504 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}