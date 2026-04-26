import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini'
import { SUMMARIZER_PROMPT, FLASHCARD_PROMPT } from '@/lib/prompts'
import { SummarizeRequest } from '@/types/api'

export async function POST(request: Request) {
  const adminClient = createAdminClient()
  
  try {
    const body: SummarizeRequest = await request.json()
    const { session_id } = body

    const { data: chunks, error: chunksError } = await adminClient
      .from('transcripts')
      .select('text')
      .eq('session_id', session_id)
      .order('chunk_index', { ascending: true })

    if (chunksError) throw chunksError

    const text = chunks.map(c => c.text).join('\n\n')

    if (!text.trim()) {
      return NextResponse.json({ error: 'No transcript data found' }, { status: 400 })
    }

    const [summaryStr, flashcardsStr] = await Promise.all([
      callGemini(SUMMARIZER_PROMPT, text),
      callGemini(FLASHCARD_PROMPT, text)
    ])

    const summary = JSON.parse(summaryStr)
    const flashcards = JSON.parse(flashcardsStr)

    const { error: upsertError } = await adminClient.from('summaries').upsert({
      session_id,
      overview: summary.overview,
      key_concepts: summary.key_concepts,
      action_items: summary.action_items,
      quiz: summary.quiz,
      flashcards
    })

    if (upsertError) throw upsertError

    const { error: updateError } = await adminClient
      .from('sessions')
      .update({ status: 'done' })
      .eq('id', session_id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true, session_id })
  } catch (error: any) {
    console.error('Summarize API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}