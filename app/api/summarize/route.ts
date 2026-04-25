// app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini'
import { SUMMARIZER_PROMPT, FLASHCARD_PROMPT } from '@/lib/prompts'
import { stripCodeFences, safeJsonParse } from '@/lib/utils'
import type { Summary, Flashcard } from '@/types/database'

export const maxDuration = 60 // Increase timeout for AI processing

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { session_id, source } = await request.json()

    if (!session_id || !source) {
      return NextResponse.json(
        { error: 'Missing session_id or source' },
        { status: 400 }
      )
    }

    // Get transcript chunks
    const { data: transcripts, error: transcriptError } = await supabase
      .from('transcripts')
      .select('text')
      .eq('session_id', session_id)
      .order('chunk_index', { ascending: true })

    if (transcriptError) {
      console.error('Transcript fetch error:', transcriptError)
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 500 }
      )
    }

    const content = transcripts?.map(t => t.text).join('\n\n') || ''

    if (!content) {
      return NextResponse.json(
        { error: 'No content found for session' },
        { status: 400 }
      )
    }

    // Run summarizer and flashcard generator in parallel
    const [summaryText, flashcardsText] = await Promise.all([
      callGemini(SUMMARIZER_PROMPT, content),
      callGemini(FLASHCARD_PROMPT, content)
    ])

    // Strip code fences and parse JSON
    const cleanedSummary = stripCodeFences(summaryText)
    const cleanedFlashcards = stripCodeFences(flashcardsText)

    const summary = safeJsonParse<{
      overview: string
      key_concepts: Array<{ term: string; definition: string }>
      action_items: Array<{ text: string; due: string | null }>
      quiz: Array<{ question: string; options: string[]; answer: string }>
    }>(cleanedSummary)

    const flashcards = safeJsonParse<Flashcard[]>(cleanedFlashcards) || []

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to parse summary response' },
        { status: 500 }
      )
    }

    // Upsert to summaries table
    const { error: summaryError } = await supabase
      .from('summaries')
      .upsert({
        session_id: session_id,
        overview: summary.overview,
        key_concepts: summary.key_concepts,
        action_items: summary.action_items,
        quiz: summary.quiz,
        flashcards: flashcards
      }, { onConflict: 'session_id' })

    if (summaryError) {
      console.error('Summary upsert error:', summaryError)
      return NextResponse.json(
        { error: 'Failed to save summary' },
        { status: 500 }
      )
    }

    // Update session status to done
    await supabase
      .from('sessions')
      .update({ status: 'done' })
      .eq('id', session_id)

    return NextResponse.json({
      ok: true,
      session_id
    })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}