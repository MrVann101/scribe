// lib/types.ts
// Scribe — TypeScript types for the application

// ============================================
// Session Types
// ============================================

export type SessionSource = 'pdf' | 'recording'
export type SessionStatus = 'processing' | 'done' | 'error'

export interface Session {
  id: string
  user_id: string
  source: SessionSource
  status: SessionStatus
  pdf_name?: string
  pdf_path?: string
  created_at: string
  updated_at: string
}

// ============================================
// Transcript Types
// ============================================

export interface TranscriptChunk {
  id: string
  session_id: string
  text: string
  chunk_index: number
  created_at: string
}

// ============================================
// Summary Types (Prompt 2 Output)
// ============================================

export interface KeyConcept {
  term: string
  definition: string
}

export interface ActionItem {
  text: string
  due: string | null
}

export interface QuizQuestion {
  question: string
  options: string[]  // ["A. ...", "B. ...", "C. ...", "D. ..."]
  answer: string     // "A", "B", "C", or "D"
}

export interface Summary {
  overview: string
  key_concepts: KeyConcept[]
  action_items: ActionItem[]
  quiz: QuizQuestion[]
}

// ============================================
// Flashcard Types (Prompt 3 Output)
// ============================================

export interface Flashcard {
  front: string
  back: string
  topic: string
}

// ============================================
// Combined Summary with Flashcards
// ============================================

export interface StudySummary extends Summary {
  flashcards: Flashcard[]
}

// ============================================
// Chat Types (Prompt 4)
// ============================================

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface SummarizeRequest {
  session_id: string
  source: 'pdf' | 'recording'
}

export interface ChatRequest {
  session_id: string
  message: string
}

export interface ChatResponse {
  reply: string
}

export interface PDFUploadResponse {
  session_id: string
  status: 'processing' | 'done' | 'error'
  message: string
}

// ============================================
// Gemini API Types
// ============================================

export interface GeminiContent {
  role: 'user' | 'model'
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>
}

export interface GeminiGenerateContentRequest {
  system_instruction?: { parts: Array<{ text: string }> }
  contents: GeminiContent[]
  generation_config?: {
    temperature?: number
    max_output_tokens?: number
    top_p?: number
    top_k?: number
  }
}

export interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
  error?: {
    code: number
    message: string
    status: string
  }
}