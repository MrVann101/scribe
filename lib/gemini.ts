// lib/gemini.ts
// Gemini API utility functions

import { GeminiGenerateContentRequest, GeminiGenerateContentResponse } from './types'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Call Gemini REST API with a prompt
 */
export async function callGemini(
  systemInstruction: string,
  userContent: string,
  options?: {
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<string> {
  const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local')
  }

  const requestBody: GeminiGenerateContentRequest = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userContent }]
      }
    ],
    generation_config: {
      temperature: options?.temperature ?? 0.7,
      max_output_tokens: options?.maxOutputTokens ?? 2048,
      top_p: 0.95,
      top_k: 40
    }
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
  }

  const data: GeminiGenerateContentResponse = await response.json()

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/**
 * Call Gemini with PDF file (base64 encoded)
 */
export async function callGeminiWithPDF(
  systemInstruction: string,
  base64PDF: string,
  userMessage: string = 'Please extract and clean the content of this PDF document.',
  options?: {
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<string> {
  const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local')
  }

  const requestBody: GeminiGenerateContentRequest = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: base64PDF
            }
          },
          {
            text: userMessage
          }
        ]
      }
    ],
    generation_config: {
      temperature: options?.temperature ?? 0.7,
      max_output_tokens: options?.maxOutputTokens ?? 8192,
      top_p: 0.95,
      top_k: 40
    }
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
  }

  const data: GeminiGenerateContentResponse = await response.json()

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/**
 * Call Gemini with chat messages (for Prompt 4)
 */
export async function callGeminiChat(
  systemInstruction: string,
  messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  options?: {
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<string> {
  const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local')
  }

  const requestBody: GeminiGenerateContentRequest = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: messages,
    generation_config: {
      temperature: options?.temperature ?? 0.7,
      max_output_tokens: options?.maxOutputTokens ?? 1024,
      top_p: 0.95,
      top_k: 40
    }
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
  }

  const data: GeminiGenerateContentResponse = await response.json()

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert Buffer to base64 (for Node.js)
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}