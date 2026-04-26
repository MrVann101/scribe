// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminClient = createAdminClient()

    // Get session
    const { data: session, error: sessionError } = await adminClient
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get summary
    const { data: summary } = await adminClient
      .from('summaries')
      .select('*')
      .eq('session_id', id)
      .single()

    return NextResponse.json({
      session,
      summary: summary || null
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('sessions')
      .update(body)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'
    const adminClient = createAdminClient()

    if (permanent) {
      // Permanently delete session and all related data (cascade handles it)
      const { error } = await adminClient
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else {
      // Soft delete — move to trash
      const { error } = await adminClient
        .from('sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Session delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    )
  }
}