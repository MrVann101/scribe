// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiChat } from '@/lib/gemini'
import { CHAT_PROMPT, buildChatMessages } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { session_id, message, history } = await request.json()

    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'Missing session_id or message' },
        { status: 400 }
      )
    }

    // Get session to determine source
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get transcript content
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

    // Build messages for Gemini
    const messages = buildChatMessages(
      content,
      session.source,
      message,
      session.pdf_name,
      history || []
    )

    // Call Gemini
    const reply = await callGeminiChat(CHAT_PROMPT, messages)

    // Save user message to DB
    const { error: insertErr } = await supabase
      .from('chat_messages')
      .insert({
        session_id,
        role: 'user',
        content: message
      })

    if (insertErr) {
      console.error('[Scribe] Failed to save user message:', insertErr)
    }

    // Save assistant reply to DB
    const { error: insertErr2 } = await supabase
      .from('chat_messages')
      .insert({
        session_id,
        role: 'assistant',
        content: reply
      })

    if (insertErr2) {
      console.error('[Scribe] Failed to save assistant message:', insertErr2)
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}