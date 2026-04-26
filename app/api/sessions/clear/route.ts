import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Since we're using the authenticated client, RLS would normally protect this.
    // However, explicitly filtering by user_id adds an extra layer of safety.
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Clear sessions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clear sessions' },
      { status: 500 }
    )
  }
}
