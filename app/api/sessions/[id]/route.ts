// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// FIX 1: params is NOT a Promise in Next.js 14 — removed Promise<> wrapper from all methods

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // FIX 2: Added auth check — admin client should verify user owns the session
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: session, error: sessionError } = await adminClient
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // FIX 3: verify ownership
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: summary } = await adminClient
      .from('summaries')
      .select('*')
      .eq('session_id', id)
      .single()

    return NextResponse.json({
      session,
      summary: summary || null,
    })
  } catch (error) {
    console.error('[Scribe] Session GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const adminClient = createAdminClient()

    // FIX 4: Whitelist allowed fields — prevent updating user_id or sensitive fields
    const allowedFields = ['title', 'subject', 'status']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // verify ownership

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update session'
    console.error('[Scribe] Session PATCH error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // FIX 5: Removed soft delete entirely — deleted_at column does not exist in schema
    // All deletes are now permanent — cascade handles transcripts/summaries/chat_messages
    if (!permanent) {
      // Even without ?permanent=true, we still delete permanently
      // Soft delete removed because deleted_at column doesn't exist
    }

    // Check session exists and user owns it
    const { data: session } = await adminClient
      .from('sessions')
      .select('pdf_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // If PDF exists in storage, delete it too
    if (session.pdf_path) {
      const { error: storageError } = await adminClient.storage
        .from('pdfs')
        .remove([session.pdf_path])

      if (storageError) {
        // Log but don't fail — DB delete is more important
        console.warn('[Scribe] Storage delete warning:', storageError.message)
      }
    }

    // Delete session row — cascade deletes transcripts, summaries, chat_messages
    const { error } = await adminClient
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete session'
    console.error('[Scribe] Session DELETE error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}