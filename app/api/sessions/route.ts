import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CreateSessionRequest } from '@/types/api'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')

  let query = supabase.from('session_with_summary_status').select('*').order('created_at', { ascending: false })
  
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

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('sessions').insert({
      user_id: user.id,
      title: body.title,
      subject: body.subject || null,
      source: body.source,
      status: body.source === 'recording' ? 'recording' : 'processing'
    }).select('id').single()

    if (error) throw error

    return NextResponse.json({ id: data.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}