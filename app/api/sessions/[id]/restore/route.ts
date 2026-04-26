import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('sessions')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Session restore error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore session' },
      { status: 500 }
    )
  }
}
