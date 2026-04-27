import { callGemini } from '@/lib/gemini'
import { BIONIC_READING_PROMPT } from '@/lib/prompts'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    if (!text?.trim()) {
      return Response.json({ html: '' })
    }

    const raw = await callGemini(BIONIC_READING_PROMPT, text, {
      maxOutputTokens: 2048,
      temperature: 0,
      jsonMode: false,
    })

    return Response.json({ html: raw })
  } catch (error) {
    console.error('Bionic reading error:', error)
    return Response.json({ html: '' })
  }
}