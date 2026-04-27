import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PDF_EXTRACTOR_PROMPT } from '@/lib/prompts'

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    // ─── 1. Auth check first — fail fast before doing any heavy work ───
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── 2. Parse form data ───
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || 'Untitled PDF'
    const subject = (formData.get('subject') as string) || null

    // ─── 3. Validate file ───
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 20MB limit' }, { status: 400 })
    }

    // ─── 4. Check env vars before doing any DB work ───
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    // FIX 1: Always use gemini-2.5-flash — never gemini-2.0-flash for REST calls
    const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'

    if (!apiKey) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_GEMINI_API_KEY is not configured' }, { status: 500 })
    }

    console.log(`[Scribe] PDF upload — model: ${model}, user: ${user.id}`)

    const adminClient = createAdminClient()

    // ─── 5. Create session row ───
    const { data: session, error: sessionError } = await adminClient
      .from('sessions')
      .insert({
        user_id: user.id,
        title,
        subject,
        source: 'pdf',
        status: 'processing',
        pdf_name: file.name,
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('[Scribe] Session insert error:', sessionError?.message)
      throw new Error(`Failed to create session: ${sessionError?.message}`)
    }

    const sessionId = session.id
    const filePath = `${user.id}/${sessionId}.pdf`
    console.log(`[Scribe] Session created: ${sessionId}`)

    // ─── 6. Convert PDF to base64 for Gemini ───
    const arrayBuffer = await file.arrayBuffer()
    const base64PDF = Buffer.from(arrayBuffer).toString('base64')

    // ─── 7. Run storage upload + Gemini extraction in parallel ───
    // FIX 2: Use gemini-2.5-flash model from env var (not hardcoded gemini-2.0-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const [storageResult, geminiResponse] = await Promise.all([
      // Upload to Supabase Storage
      adminClient.storage.from('pdfs').upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      }),
      // Extract text with Gemini
      fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: PDF_EXTRACTOR_PROMPT }] },
          contents: [{
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64PDF,
                },
              },
              {
                text: 'Please extract and clean the content of this PDF document.',
              },
            ],
          }],
          // FIX 3: Add generation config to keep output clean
          generationConfig: {
            temperature: 0.1,  // low temp = more consistent extraction
            maxOutputTokens: 8192,
          },
        }),
      }),
    ])

    // ─── 8. Handle storage result ───
    if (storageResult.error) {
      console.error('[Scribe] Storage upload error:', storageResult.error.message)
      throw new Error(`Storage upload failed: ${storageResult.error.message}`)
    }
    console.log(`[Scribe] PDF uploaded to storage: ${filePath}`)

    // ─── 9. Handle Gemini result ───
    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('[Scribe] Gemini extraction error:', errText)

      // FIX 4: Give helpful error messages based on status code
      if (geminiResponse.status === 429) {
        // Quota exhausted — update session to error and return clear message
        await adminClient.from('sessions').update({ status: 'error' }).eq('id', sessionId)
        return NextResponse.json({
          error: 'Gemini API quota exceeded. Please wait a minute and try again, or use a different API key.',
          session_id: sessionId,
          code: 'QUOTA_EXCEEDED',
        }, { status: 429 })
      }

      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        await adminClient.from('sessions').update({ status: 'error' }).eq('id', sessionId)
        return NextResponse.json({
          error: 'Gemini API key is invalid or unauthorized. Check your NEXT_PUBLIC_GEMINI_API_KEY.',
          code: 'UNAUTHORIZED',
        }, { status: 401 })
      }

      throw new Error(`Gemini extraction failed (${geminiResponse.status}): ${errText}`)
    }

    const geminiData = await geminiResponse.json()
    const cleanedText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!cleanedText.trim()) {
      throw new Error('Gemini returned empty content — PDF may be image-only or unreadable')
    }

    console.log(`[Scribe] Gemini extracted ${cleanedText.length} characters`)

    // ─── 10. Split cleaned text into chunks by Topic labels ───
    const rawChunks = cleanedText.split(/(?=Topic:\s)/i).map((c: string) => c.trim()).filter(Boolean)

    const transcriptChunks = rawChunks.map((chunkText: string, i: number) => {
      let topicLabel: string | null = null
      let text = chunkText

      const topicMatch = text.match(/^Topic:\s*(.+?)(\n|$)/i)
      if (topicMatch) {
        topicLabel = topicMatch[1].trim()
        text = text.replace(/^Topic:\s*(.+?)(\n|$)/i, '').trim()
      }

      // FIX 5: Strip <alert> tags from text but keep is_alert flag
      const hasAlert = text.includes('<alert>')
      const cleanText = text.replace(/<\/?alert>/gi, '').trim()

      return {
        session_id: sessionId,
        chunk_index: i,
        text: cleanText || chunkText, // fallback to original if cleaning empties it
        is_alert: hasAlert,
        topic_label: topicLabel,
        source: 'pdf' as const,
      }
    })

    // ─── 11. Save transcript chunks ───
    if (transcriptChunks.length > 0) {
      const { error: insertError } = await adminClient
        .from('transcripts')
        .insert(transcriptChunks)

      if (insertError) {
        console.error('[Scribe] Transcript insert error:', insertError.message)
        throw new Error(`Failed to save transcript: ${insertError.message}`)
      }
      console.log(`[Scribe] Saved ${transcriptChunks.length} transcript chunks`)
    }

    // ─── 12. Update session with file info ───
    await adminClient
      .from('sessions')
      .update({
        pdf_path: filePath,
        page_count: transcriptChunks.length, // use chunk count as proxy for pages
        status: 'processing', // summarize will set this to 'done'
      })
      .eq('id', sessionId)

    // ─── 13. Trigger summarize in background (fire and forget) ───
    // FIX 6: Use relative URL so it works on localhost without NEXT_PUBLIC_APP_URL issues
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch((e) => console.error('[Scribe] Summarize trigger failed:', e))

    console.log(`[Scribe] PDF upload complete — session: ${sessionId}`)

    return NextResponse.json({
      session_id: sessionId,
      page_count: transcriptChunks.length,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('[Scribe] PDF Upload Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}