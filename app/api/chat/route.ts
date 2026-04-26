import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiChat } from '@/lib/gemini'
import { CHAT_PROMPT } from '@/lib/prompts'
import { ChatRequest } from '@/types/api'

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const body: ChatRequest = await request.json()
    const { session_id, message, history } = body

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('source, pdf_name')
      .eq('id', session_id)
      .single()

    if (sessionError) throw sessionError

    const { data: chunks, error: chunksError } = await supabase
      .from('transcripts')
      .select('text')
      .eq('session_id', session_id)
      .order('chunk_index', { ascending: true })

    if (chunksError) throw chunksError

    const content = chunks.map(c => c.text).join('\n\n')

    const context = session.source === 'pdf'
      ? `Here is the full text extracted from the PDF "${session.pdf_name}":\n\n${content}`
      : `Here is the full lecture transcript:\n\n${content}`

    const reply = await callGeminiChat(CHAT_PROMPT, context, history, message)

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}