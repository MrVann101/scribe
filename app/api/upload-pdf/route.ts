// app/api/upload-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiWithPDF } from '@/lib/gemini'
import { PDF_EXTRACTOR_PROMPT } from '@/lib/prompts'
import { stripCodeFences } from '@/lib/utils'

export const maxDuration = 60 // Increase timeout for PDF processing

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string || 'Untitled PDF'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const base64PDF = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Call Gemini to extract and clean PDF content
    const cleanedText = await callGeminiWithPDF(
      PDF_EXTRACTOR_PROMPT,
      base64PDF,
      'Please extract and clean the content of this PDF document.'
    )

    // Create session in Supabase
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        source: 'pdf',
        pdf_name: file.name,
        title: title,
        status: 'processing',
        user_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Split cleaned text into chunks by "Topic:" labels
    const chunks = cleanedText.split(/(?=Topic:)/g).filter(c => c.trim())

    // Save transcript chunks
    const transcriptInserts = chunks.map((chunk, index) => ({
      session_id: session.id,
      text: chunk.trim(),
      chunk_index: index,
      source: 'pdf' as const
    }))

    const { error: transcriptError } = await supabase
      .from('transcripts')
      .insert(transcriptInserts)

    if (transcriptError) {
      console.error('Transcript save error:', transcriptError)
    }

    // Trigger summarize API (in background)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: session.id,
        source: 'pdf'
      })
    }).catch(console.error)

    return NextResponse.json({
      session_id: session.id,
      page_count: chunks.length
    })
      message: 'PDF uploaded successfully. Processing in background.'
    })
  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}

/**
 * Split cleaned text into chunks by Topic: labels
 */
function splitIntoChunks(text: string): string[] {
  const lines = text.split('\n')
  const chunks: string[] = []
  let currentChunk = ''

  for (const line of lines) {
    if (line.startsWith('Topic:')) {
      // Start new chunk
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = line + '\n'
    } else {
      currentChunk += line + '\n'
    }
  }

  // Add final chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  // If no Topic: labels found, return single chunk
  if (chunks.length === 0 && text.trim()) {
    return [text.trim()]
  }

  return chunks
}