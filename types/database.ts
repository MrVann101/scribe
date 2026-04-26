export type SessionSource = 'recording' | 'pdf'
export type SessionStatus = 'recording' | 'processing' | 'done' | 'error'
export type MessageRole = 'user' | 'assistant'

export interface Session {
  id: string
  user_id: string
  title: string
  subject: string | null
  source: SessionSource
  status: SessionStatus
  duration_sec: number | null    // recording sessions only
  pdf_path: string | null        // pdf sessions only
  pdf_name: string | null        // pdf sessions only
  page_count: number | null      // pdf sessions only
  created_at: string
  updated_at: string
}

export interface SessionWithSummaryStatus extends Session {
  has_summary: boolean
  has_flashcards: boolean
  has_quiz: boolean
}

export interface Transcript {
  id: string
  session_id: string
  chunk_index: number
  text: string
  is_alert: boolean
  topic_label: string | null
  source: SessionSource
  created_at: string
}

export interface Flashcard {
  front: string
  back: string
  topic: string
}

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
  options: string[]   // ["A. ...", "B. ...", "C. ...", "D. ..."]
  answer: string      // "A" | "B" | "C" | "D"
}

export interface Summary {
  id: string
  session_id: string
  overview: string | null
  key_concepts: KeyConcept[] | null
  action_items: ActionItem[] | null
  quiz: QuizQuestion[] | null
  flashcards: Flashcard[] | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  created_at: string
}