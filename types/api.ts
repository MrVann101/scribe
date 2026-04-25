// types/api.ts
// Scribe — API request/response types

export interface CreateSessionRequest {
  title: string
  subject?: string
  source: 'recording' | 'pdf'
}

export interface CreateSessionResponse {
  id: string
}

export interface SaveTranscriptChunkRequest {
  session_id: string
  chunk_index: number
  text: string
  is_alert: boolean
  topic_label?: string
  source: 'recording' | 'pdf'
}

export interface SummarizeRequest {
  session_id: string
}

export interface SummarizeResponse {
  ok: boolean
  session_id: string
}

export interface ChatRequest {
  session_id: string
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ChatResponse {
  reply: string
}

export interface UploadPDFResponse {
  session_id: string
  page_count: number
}

export interface ApiError {
  error: string
}