// app/api/sessions/route.ts
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CreateSessionRequest } from '@/types/api'

export async function GET(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')

  let query = supabase
    .from('session_with_summary_status')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (source === 'recording' || source === 'pdf') {
    query = query.eq('source', source)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body: CreateSessionRequest = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // FIX: Prevent duplicate sessions from React 18 StrictMode double-firing useEffect
    // Check if a session was already created in the last 5 seconds for this user
    // with the same source — if so return the existing one instead of creating a new one
    const adminClient = createAdminClient()

    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()

    const { data: existing } = await adminClient
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', body.source)
      .eq('status', body.source === 'recording' ? 'recording' : 'processing')
      .eq('title', body.title || 'New Recording')
      .gte('created_at', fiveSecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If a very recent identical session exists, return it instead of creating duplicate
    if (existing) {
      console.log('[Scribe] Returning existing session (StrictMode guard):', existing.id)
      return NextResponse.json({ id: existing.id })
    }

    // Create new session
    const { data, error } = await adminClient
      .from('sessions')
      .insert({
        user_id: user.id,
        title: body.title || 'New Recording',
        subject: body.subject || null,
        source: body.source,
        status: body.source === 'recording' ? 'recording' : 'processing',
      })
      .select('id')
      .single()

    if (error) throw error

    console.log('[Scribe] Session created:', data.id)
    return NextResponse.json({ id: data.id })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('[Scribe] Session POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}