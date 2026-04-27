// lib/gemini.ts
// Shared Gemini API helper — used by all API routes
// Never import this in client components — server only

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getConfig() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local')
  }

  return { apiKey, model }
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```json\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}

// ─── callGemini ───────────────────────────────────────────────────────────────
// For single-turn calls: summarize, flashcards, PDF extract
// Returns raw string — caller is responsible for JSON.parse()
export async function callGemini(
  systemPrompt: string,
  userText: string,
  options: {
    maxOutputTokens?: number
    temperature?: number
    jsonMode?: boolean
  } = {}
): Promise<string> {
  const { apiKey, model } = getConfig()
  const {
    maxOutputTokens = 2048,  // FIX: cap tokens so Gemini responds faster
    temperature = 0.2,        // FIX: low temp = faster, more consistent JSON
    jsonMode = true,          // FIX: JSON mode skips markdown wrapping
  } = options

  const response = await fetch(
    `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userText }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          // FIX: Tell Gemini to return JSON directly — no markdown, no preamble
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()

    // Parse error for better messages
    try {
      const errJson = JSON.parse(errText)
      const status = errJson?.error?.status
      const message = errJson?.error?.message || errText

      if (response.status === 429 || status === 'RESOURCE_EXHAUSTED') {
        throw new Error(`QUOTA_EXCEEDED: ${message}`)
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(`UNAUTHORIZED: Invalid Gemini API key`)
      }
      throw new Error(`Gemini API error ${response.status}: ${message}`)
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith('QUOTA_EXCEEDED')) {
        throw parseErr
      }
      throw new Error(`Gemini API error ${response.status}: ${errText}`)
    }
  }

  const data = await response.json()
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!raw.trim()) {
    throw new Error('Gemini returned empty response')
  }

  // Strip code fences in case Gemini ignores responseMimeType
  return stripCodeFences(raw)
}

// ─── callGeminiChat ───────────────────────────────────────────────────────────
// For multi-turn chat — injects transcript context and message history
// Returns plain text response (not JSON)
export async function callGeminiChat(
  systemPrompt: string,
  context: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string
): Promise<string> {
  const { apiKey, model } = getConfig()

  // Build message array — inject context first, then history, then new message
  const messages = [
    // Context injection
    {
      role: 'user',
      parts: [{ text: `Here is the full study material:\n\n${context}` }],
    },
    {
      role: 'model',
      parts: [{ text: 'I have read the study material and am ready to help.' }],
    },
    // Conversation history
    ...history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    // New message
    {
      role: 'user',
      parts: [{ text: newMessage }],
    },
  ]

  const response = await fetch(
    `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: messages,
        generationConfig: {
          temperature: 0.7,      // higher temp for natural chat responses
          maxOutputTokens: 512,  // chat replies should be short
        },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    if (response.status === 429) throw new Error('QUOTA_EXCEEDED')
    throw new Error(`Gemini chat error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!text.trim()) throw new Error('Gemini returned empty chat response')

  return text.trim()
}