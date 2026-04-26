// app/api/chat/history/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      )
    }

    // Get chat history (RLS automatically isolates to user's sessions)
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Chat history fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages || []
    })
  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}