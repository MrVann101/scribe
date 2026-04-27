import { callGemini } from '@/lib/gemini'
import { PODCAST_PROMPT } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json()
    
    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: summary, error } = await supabase
      .from('summaries')
      .select('overview, key_concepts, action_items')
      .eq('session_id', session_id)
      .single()

    if (error || !summary) {
      return Response.json({ error: 'Summary not found' }, { status: 404 })
    }

    const input = JSON.stringify(summary)

    const script = await callGemini(PODCAST_PROMPT, input, {
      maxOutputTokens: 600,
      temperature: 0.4,
      jsonMode: false,
    })

    return Response.json({ script })
  } catch (error) {
    console.error('Podcast script error:', error)
    return Response.json({ error: 'Failed to generate podcast script' }, { status: 500 })
  }
}