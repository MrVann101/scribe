// app/api/transcripts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { session_id, transcript, is_alert, topic_label } = await request.json()

    if (!session_id || !transcript) {
      return NextResponse.json(
        { error: 'Missing session_id or transcript' },
        { status: 400 }
      )
    }

    // Get current max chunk_index
    const { data: existing } = await supabase
      .from('transcripts')
      .select('chunk_index')
      .eq('session_id', session_id)
      .order('chunk_index', { ascending: false })
      .limit(1)

    const nextIndex = existing?.length ? existing[0].chunk_index + 1 : 0

    // Insert chunk
    const { error } = await supabase
      .from('transcripts')
      .insert({
        session_id,
        text: transcript,
        chunk_index: nextIndex,
        is_alert: is_alert || false,
        topic_label: topic_label || null
      })

    if (error) {
      console.error('Transcript save error:', error)
      return NextResponse.json(
        { error: 'Failed to save transcript' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chunks_count: chunks.length
    })
  } catch (error) {
    console.error('Transcripts API error:', error)
    return NextResponse.json(
      { error: 'Failed to save transcript' },
      { status: 500 }
    )
  }
}