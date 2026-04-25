// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { source, title, subject } = await request.json()

    // Create a new session
    // Note: In production, get user_id from auth
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        source: source || 'recording',
        status: 'processing',
        title: title || 'Untitled Session',
        subject: subject || null,
        user_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single()

    if (error) {
      console.error('Session creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: session.id
    })
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')

    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (source) {
      query = query.eq('source', source)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Session fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json(sessions || [])
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}