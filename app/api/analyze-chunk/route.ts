import { callGemini } from '@/lib/gemini'
import { FOCUS_MODE_PROMPT } from '@/lib/prompts'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    if (!text?.trim()) {
      return Response.json({ 
        importance_score: 1, 
        signal_type: 'none', 
        reason: 'Empty chunk', 
        keywords: [] 
      })
    }

    const raw = await callGemini(FOCUS_MODE_PROMPT, text, {
      maxOutputTokens: 150,
      temperature: 0.1,
      jsonMode: true,
    })

    const signal = JSON.parse(raw)
    return Response.json(signal)
  } catch (error) {
    console.error('Focus mode analysis error:', error)
    return Response.json({ 
      importance_score: 1, 
      signal_type: 'none', 
      reason: 'Analysis failed', 
      keywords: [] 
    })
  }
}