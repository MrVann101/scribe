import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PDF_EXTRACTOR_PROMPT } from '@/lib/prompts'

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const subject = formData.get('subject') as string

    if (!file || !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Valid PDF file required' }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 20MB limit' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: session, error: sessionError } = await adminClient.from('sessions').insert({
      user_id: user.id,
      title,
      subject: subject || null,
      source: 'pdf',
      status: 'processing',
      pdf_name: file.name
    }).select('id').single()

    if (sessionError) throw sessionError

    const sessionId = session.id

    const filePath = `${user.id}/${sessionId}.pdf`
    const { error: storageError } = await adminClient.storage
      .from('pdfs')
      .upload(filePath, file)
      
    if (storageError) throw storageError

    const arrayBuffer = await file.arrayBuffer()
    const base64PDF = Buffer.from(arrayBuffer).toString('base64')
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PDF_EXTRACTOR_PROMPT }] },
        contents: [{
          role: 'user',
          parts: [
            { inline_data: { mime_type: 'application/pdf', data: base64PDF } },
            { text: 'Please extract and clean the content of this PDF document.' }
          ]
        }]
      })
    })

    if (!geminiResponse.ok) {
      const errTxt = await geminiResponse.text()
      throw new Error(`Gemini PDF extract failed: ${errTxt}`)
    }

    const data = await geminiResponse.json()
    const cleanedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const chunks = cleanedText.split(/(?=Topic:)/i).map((c: string) => c.trim()).filter(Boolean)

    for (let i = 0; i < chunks.length; i++) {
      let chunkText = chunks[i]
      let topicLabel = null
      
      const topicMatch = chunkText.match(/^Topic:\s*(.+)/i)
      if (topicMatch) {
        topicLabel = topicMatch[1]
        chunkText = chunkText.replace(/^Topic:\s*(.+)/i, '').trim()
      }

      await adminClient.from('transcripts').insert({
        session_id: sessionId,
        chunk_index: i,
        text: chunkText,
        is_alert: chunkText.includes('<alert>'),
        topic_label: topicLabel,
        source: 'pdf'
      })
    }

    await adminClient.from('sessions').update({ pdf_path: filePath, page_count: 0 }).eq('id', sessionId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    }).catch(e => console.error("Summary trigger failed:", e))

    return NextResponse.json({ session_id: sessionId, page_count: 0 })
  } catch (error: any) {
    console.error('PDF Upload Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}