import { callGemini } from '@/lib/gemini'
import { MIND_MAP_PROMPT } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json()
    
    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch summary from Supabase
    const { data: summary, error } = await supabase
      .from('summaries')
      .select('overview, key_concepts')
      .eq('session_id', session_id)
      .single()

    if (error || !summary) {
      return Response.json({ error: 'Summary not found' }, { status: 404 })
    }

    // Build a condensed input — don't send raw transcript
    const keyConceptsText = Array.isArray(summary.key_concepts)
      ? summary.key_concepts.map((c: { term: string; definition: string }) =>
          `- ${c.term}: ${c.definition}`
        ).join('\n')
      : ''

    const input = `
Overview: ${summary.overview}

Key Concepts:
${keyConceptsText}
    `.trim()

    const raw = await callGemini(MIND_MAP_PROMPT, input, {
      maxOutputTokens: 1000,
      temperature: 0.2,
      jsonMode: true,
    })

    return Response.json(JSON.parse(raw))
  } catch (error) {
    console.error('Mind map generation error:', error)
    return Response.json({ error: 'Failed to generate mind map' }, { status: 500 })
  }
}