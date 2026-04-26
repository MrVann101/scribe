import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { SaveTranscriptChunkRequest } from '@/types/api'

export async function POST(request: Request) {
  const adminClient = createAdminClient()
  
  try {
    const body: SaveTranscriptChunkRequest = await request.json()
    
    const { error } = await adminClient.from('transcripts').insert({
      session_id: body.session_id,
      chunk_index: body.chunk_index,
      text: body.text,
      is_alert: body.is_alert,
      topic_label: body.topic_label || null,
      source: body.source
    })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}