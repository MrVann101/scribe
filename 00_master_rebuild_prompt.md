# 🔨 Scribe — Master Codebase Rebuild Prompt
> Give this entire document to an AI coding assistant (Claude, Cursor, v0, etc.)
> It contains everything needed to generate the full Scribe codebase from scratch —
> correctly named, zero duplication, and fully connected end-to-end.

---

## CONTEXT

You are building **Scribe** — an AI-powered study companion for Filipino college students.
Students can either record a live lecture (with Bisaya→English translation) or upload a PDF,
and Scribe generates a study guide, flashcards, a quiz, and a context-aware chat — all powered by Gemini 2.0/2.5.

**Stack:**
- Framework: Next.js 14 App Router + TypeScript
- Styling: Tailwind CSS v4 (dark mode, class strategy)
- Database + Auth + Storage: Supabase
- AI: Gemini 2.0 Flash Live (WebSocket) + Gemini 2.5 Flash (REST)
- Icons: Lucide React
- Fonts: Syne (headings) + DM Sans (body) + JetBrains Mono (transcript/code)

---

## RULES FOR THE AI

1. **No duplication.** Every piece of logic lives in exactly one place. If two files need the same thing, it goes in a shared helper and both import it.
2. **Correct env variable names throughout.** Client-side code uses `NEXT_PUBLIC_` prefix. Server-side code uses non-prefixed keys. See the env section below.
3. **Every file must be fully connected.** No orphan files. Every component is imported somewhere. Every API route is called from somewhere.
4. **TypeScript everywhere.** No `any` types. All Supabase table rows have matching TypeScript types in `types/database.ts`.
5. **Single source of truth for prompts.** All 5 Gemini system prompts live only in `lib/prompts.ts`. No prompt strings anywhere else.
6. **Single Supabase client per context.** `lib/supabase/server.ts` for API routes and Server Components. `lib/supabase/client.ts` for Client Components. Never mix them.
7. **App name is Scribe.** No references to "AI Study Companion", "study-companion", or any other name.
8. **'use client' only where needed.** Server Components by default. Only add `'use client'` to components that use hooks, browser APIs, or event handlers.

---

## ENVIRONMENT VARIABLES

```env
# .env.local

# Gemini — NEXT_PUBLIC prefix required (used in client hook + server routes)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash

# Supabase — URL and anon key are public, service role is server-only
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Rules:**
- `NEXT_PUBLIC_GEMINI_API_KEY` — used in `useGeminiLive.ts` (client) and all API routes (server)
- `NEXT_PUBLIC_GEMINI_MODEL` — REST model name (gemini-2.5-flash). Live WebSocket always uses `gemini-2.0-flash-live-001` hardcoded.
- `SUPABASE_SERVICE_ROLE_KEY` — only in API routes, never in client code

---

## COMPLETE FOLDER STRUCTURE

Generate every file listed below. Do not skip any.

```
scribe/
├── .env.local                          ← env variables (listed above)
├── .env.example                        ← same keys, empty values, safe to commit
├── .gitignore                          ← include .env.local
├── next.config.ts                      ← enable turbopack: false, images config
├── tailwind.config.ts                  ← darkMode: 'class', Syne+DM Sans+JetBrains Mono fonts
├── tsconfig.json                       ← paths: { "@/*": ["./*"] }
├── package.json                        ← all deps listed in DEPENDENCIES section below
│
├── app/
│   ├── layout.tsx                      ← root layout, dark class on html, font variables
│   ├── globals.css                     ← tailwind directives + CSS variables for colors
│   ├── page.tsx                        ← redirects auth users → /dashboard, guests → /login
│   │
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                ← Google OAuth via Supabase, Scribe branding
│   │
│   ├── dashboard/
│   │   └── page.tsx                    ← session list, filter by source, stats bar, FAB
│   │
│   ├── new/
│   │   └── page.tsx                    ← choice screen: Record vs Upload PDF
│   │
│   ├── record/
│   │   └── page.tsx                    ← live recording UI, uses useGeminiLive + useMicrophone
│   │
│   ├── upload/
│   │   └── page.tsx                    ← PDF upload UI, 4-step progress flow
│   │
│   ├── session/
│   │   └── [id]/
│   │       └── page.tsx                ← bento grid: Summary, Flashcards, Quiz, Chat tabs
│   │
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx                ← full chat page for a session
│   │
│   └── api/
│       ├── sessions/
│       │   └── route.ts                ← GET (list), POST (create)
│       ├── transcripts/
│       │   └── route.ts                ← POST (save chunk)
│       ├── summarize/
│       │   └── route.ts                ← POST (fetch transcript → Gemini → save summary)
│       ├── upload-pdf/
│       │   └── route.ts                ← POST (upload to storage → Gemini extract → save chunks)
│       └── chat/
│           └── route.ts                ← POST (inject context → Gemini → return reply)
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx                  ← variants: primary, secondary, ghost, danger + loading state
│   │   ├── Card.tsx                    ← base card wrapper
│   │   ├── Badge.tsx                   ← source badge (recording=blue, pdf=orange), status badge
│   │   ├── Input.tsx                   ← styled text input
│   │   ├── Spinner.tsx                 ← loading spinner
│   │   └── EmptyState.tsx              ← reusable empty state with icon + message
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx                 ← desktop sidebar nav (Dashboard, New, Flashcards, Profile)
│   │   ├── BottomNav.tsx               ← mobile bottom tab bar
│   │   └── TopBar.tsx                  ← mobile top bar with back button + title
│   │
│   ├── record/
│   │   ├── MicButton.tsx               ← animated mic: idle → recording pulse → processing
│   │   └── TranscriptViewer.tsx        ← renders chunks, highlights alerts (amber), topic labels (violet)
│   │
│   ├── session/
│   │   ├── BentoGrid.tsx               ← 2x2 grid layout, accepts summary data
│   │   ├── OverviewCard.tsx            ← 3-sentence overview + action items
│   │   ├── ConceptsCard.tsx            ← expandable key concepts list
│   │   ├── QuizCard.tsx                ← MCQ with answer reveal, score at end
│   │   └── FlashcardDeck.tsx           ← flip animation deck, swipe got-it/still-learning
│   │
│   └── chat/
│       ├── ChatThread.tsx              ← message list, user right / AI left
│       └── ChatInput.tsx               ← textarea, send on Enter, Shift+Enter for newline
│
├── hooks/
│   ├── useGeminiLive.ts                ← WebSocket to Gemini Live API (fixed version)
│   ├── useMicrophone.ts                ← getUserMedia, AudioWorklet, sends PCM to useGeminiLive
│   └── useChat.ts                      ← chat message state, POST /api/chat, save reply to DB
│
├── lib/
│   ├── prompts.ts                      ← ALL 5 Gemini system prompts as exported constants
│   ├── gemini.ts                       ← callGemini() and callGeminiChat() helper functions
│   ├── supabase/
│   │   ├── server.ts                   ← createServerClient() using @supabase/ssr + cookies()
│   │   └── client.ts                   ← createBrowserClient() using @supabase/ssr
│   └── utils.ts                        ← cn(), formatDate(), formatDuration(), truncate()
│
└── types/
    ├── database.ts                     ← Session, Transcript, Summary, ChatMessage, Flashcard types
    └── api.ts                          ← request/response types for all API routes
```

---

## DEPENDENCIES

```json
{
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.2.5"
  }
}
```

> Note: Use Next.js 14 not 16. Next.js 16 does not exist — the package.json that had 16.2.4 was incorrect and caused install errors.

---

## DATABASE SCHEMA

These are the exact 4 tables. TypeScript types in `types/database.ts` must match exactly.

```typescript
// types/database.ts

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
```

---

## API TYPES

```typescript
// types/api.ts

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
```

---

## LIB FILES

### lib/prompts.ts

Export exactly these 5 constants. No other prompt strings should exist anywhere in the codebase.

```typescript
export const LIVE_TRANSCRIBER_PROMPT = `...` // Full prompt from 02_agent_prompts.md Prompt 1
export const SUMMARIZER_PROMPT = `...`        // Full prompt from 02_agent_prompts.md Prompt 2
export const FLASHCARD_PROMPT = `...`         // Full prompt from 02_agent_prompts.md Prompt 3
export const CHAT_PROMPT = `...`              // Full prompt from 02_agent_prompts.md Prompt 4
export const PDF_EXTRACTOR_PROMPT = `...`     // Full prompt from 02_agent_prompts.md Prompt 5
```

### lib/gemini.ts

```typescript
// Two exported functions only — imported by all API routes

// For REST calls (summarize, flashcards, PDF extract)
export async function callGemini(systemPrompt: string, userText: string): Promise<string>

// For chat — accepts full message history
export async function callGeminiChat(
  systemPrompt: string,
  context: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string
): Promise<string>
```

Both functions must:
- Use `NEXT_PUBLIC_GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_MODEL` from env
- Strip markdown code fences from Gemini response before returning
- Throw descriptive errors with the Gemini status code if the request fails

### lib/supabase/server.ts

```typescript
// Used in: all app/api/* route.ts files + Server Components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
```

### lib/supabase/client.ts

```typescript
// Used in: all 'use client' components and hooks
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### lib/utils.ts

```typescript
export function cn(...inputs: ClassValue[]): string   // Tailwind class merge
export function formatDate(iso: string): string       // "Apr 25, 2026"
export function formatDuration(seconds: number): string // "1h 24m" or "45m"
export function truncate(text: string, max: number): string
```

---

## HOOKS

### hooks/useGeminiLive.ts

Use this exact implementation — it is already correct and debugged:

```typescript
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { LIVE_TRANSCRIBER_PROMPT } from '@/lib/prompts'

// WebSocket URL for Gemini Multimodal Live API
const GEMINI_LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

// Always use the live-specific model — NOT gemini-2.5-flash
const LIVE_MODEL = 'gemini-2.0-flash-live-001'

interface UseGeminiLiveOptions {
  onTranscript?: (text: string) => void
  onError?: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

interface UseGeminiLiveReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  sendAudio: (audioData: ArrayBuffer) => void
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
  const { onTranscript, onError, onConnected, onDisconnected } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const intentionalCloseRef = useRef(false)

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)
    intentionalCloseRef.current = false

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local')

      const ws = new WebSocket(`${GEMINI_LIVE_WS_URL}?key=${apiKey}`)

      ws.onopen = () => {
        if (ws.readyState !== WebSocket.OPEN) return
        ws.send(JSON.stringify({
          setup: {
            model: `models/${LIVE_MODEL}`,
            system_instruction: { parts: [{ text: LIVE_TRANSCRIBER_PROMPT }] },
            generation_config: { response_modalities: ['TEXT'] },
          },
        }))
        setIsConnected(true)
        setIsConnecting(false)
        onConnected?.()
      }

      ws.onmessage = async (event) => {
        try {
          const raw = event.data instanceof Blob ? await event.data.text() : event.data
          const data = JSON.parse(raw)

          if (data.serverContent?.modelTurn?.parts) {
            const text = data.serverContent.modelTurn.parts
              .map((p: { text?: string }) => p.text ?? '')
              .join('')
            if (text.trim()) onTranscript?.(text)
          }

          if (data.error) {
            setError(`Gemini error: ${data.error.message ?? 'Unknown'}`)
            onError?.(new Error(data.error.message ?? 'Gemini error'))
          }
        } catch (err) {
          console.error('[Scribe] WS parse error:', err)
        }
      }

      ws.onerror = () => {
        const msg = 'Connection failed. Check API key and internet.'
        setError(msg)
        setIsConnecting(false)
        onError?.(new Error(msg))
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        if (!intentionalCloseRef.current) {
          onDisconnected?.()
          if (event.code === 1008) setError('API key invalid or unauthorized.')
          else if (event.code !== 1000) setError(`Disconnected (code ${event.code}). Try again.`)
        }
      }

      wsRef.current = ws
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      setError(msg)
      setIsConnecting(false)
      onError?.(new Error(msg))
    }
  }, [isConnected, isConnecting, onTranscript, onError, onConnected, onDisconnected])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    wsRef.current?.close(1000, 'User disconnected')
    wsRef.current = null
    setIsConnected(false)
    setIsConnecting(false)
    onDisconnected?.()
  }, [onDisconnected])

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    const bytes = new Uint8Array(audioData)
    let binary = ''
    bytes.forEach(b => binary += String.fromCharCode(b))
    wsRef.current.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: btoa(binary) }],
      },
    }))
  }, [])

  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true
      wsRef.current?.close(1000, 'Unmounted')
    }
  }, [])

  return { isConnected, isConnecting, error, connect, disconnect, sendAudio }
}

export default useGeminiLive
```

### hooks/useMicrophone.ts

```typescript
'use client'
// Captures mic audio, converts to 16kHz mono PCM, calls sendAudio()
// Uses AudioWorklet for low-latency processing without blocking the main thread

export interface UseMicrophoneOptions {
  sendAudio: (data: ArrayBuffer) => void
  onError?: (err: Error) => void
}

export interface UseMicrophoneReturn {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
}

export function useMicrophone(options: UseMicrophoneOptions): UseMicrophoneReturn
```

Implementation requirements:
- `navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true } })`
- Convert Float32 audio samples to Int16 PCM before passing to `sendAudio`
- Use `AudioContext` with `createScriptProcessor` as fallback if AudioWorklet not available
- Call `stopRecording` on cleanup

### hooks/useChat.ts

```typescript
'use client'
// Manages chat message state for a session
// Loads history from Supabase, sends new messages to /api/chat, saves reply

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
}

export function useChat(sessionId: string): UseChatReturn
```

Implementation requirements:
- On mount: fetch existing `chat_messages` from Supabase ordered by `created_at asc`
- On `sendMessage`: optimistically add user message to state, POST to `/api/chat`, add assistant reply
- Save both user message and assistant reply to Supabase `chat_messages` table
- Import `createClient` from `@/lib/supabase/client`

---

## API ROUTES

### app/api/sessions/route.ts

```
GET  → fetch all sessions for current user from session_with_summary_status view
       query param: ?source=recording|pdf (optional filter)
       returns: Session[]

POST → create new session
       body: CreateSessionRequest
       returns: CreateSessionResponse { id: string }
       also sets status: 'recording' for recording, 'processing' for pdf
```

### app/api/transcripts/route.ts

```
POST → save one transcript chunk
       body: SaveTranscriptChunkRequest
       returns: { ok: true }
```

### app/api/summarize/route.ts

```
POST → body: { session_id: string }
  1. Fetch all transcript chunks ordered by chunk_index
  2. Concatenate text with '\n'
  3. Promise.all([callGemini(SUMMARIZER_PROMPT, text), callGemini(FLASHCARD_PROMPT, text)])
  4. Parse both JSON responses (strip code fences first)
  5. Upsert to summaries table
  6. Update session status → 'done'
  returns: SummarizeResponse
```

### app/api/upload-pdf/route.ts

```
POST → body: FormData with fields: file (PDF), title, subject
  1. Validate file is PDF and under 20MB
  2. Create session row (source: 'pdf', status: 'processing')
  3. Upload to Supabase Storage: pdfs/{user_id}/{session_id}.pdf
  4. Convert PDF to base64, send to Gemini with PDF_EXTRACTOR_PROMPT
  5. Split cleaned text by 'Topic:' labels into chunks
  6. Save chunks to transcripts table with source: 'pdf'
  7. Call /api/summarize internally (or inline the logic)
  8. Update session: pdf_path, pdf_name, page_count, status: 'done'
  returns: UploadPDFResponse
```

### app/api/chat/route.ts

```
POST → body: ChatRequest
  1. Fetch full transcript text for the session
  2. Build messages array: [context injection, history..., new message]
  3. Call callGeminiChat(CHAT_PROMPT, transcript, history, message)
  4. Return reply text
  returns: ChatResponse
  Note: Saving messages to DB is done client-side in useChat hook
```

---

## PAGES

### app/layout.tsx

- Add `dark` class to `<html>` — dark mode is always on
- Load fonts via `next/font/google`: Syne (variable `--font-syne`), DM Sans (variable `--font-dm-sans`), JetBrains Mono (variable `--font-mono`)
- Apply font variables to `<body>`
- No Sidebar here — each page handles its own layout

### app/page.tsx

```typescript
// Server Component
// Check Supabase auth session
// If logged in → redirect('/dashboard')
// If not → redirect('/login')
```

### app/(auth)/login/page.tsx

- Client Component
- Show Scribe logo/wordmark centered on dark background
- "Sign in with Google" button calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` } })`
- Show loading state while redirecting

### app/dashboard/page.tsx

- Server Component
- Fetch sessions from `session_with_summary_status` view
- Render: stats bar (total sessions, total flashcards), filter pills (All / Recordings / PDFs), session list
- Each session card shows: source badge, title, subject, date, status badges, action buttons (View, Chat, Study)
- Import `Sidebar` (desktop) and `BottomNav` (mobile) layout components

### app/new/page.tsx

- Client Component
- Two large cards: Record (blue) and Upload PDF (orange)
- Record card → `router.push('/record')`
- PDF card → `router.push('/upload')`

### app/record/page.tsx

- Client Component
- Uses `useGeminiLive` and `useMicrophone` hooks
- Session title input + subject selector at top
- `MicButton` component in center
- `TranscriptViewer` below showing live chunks
- On "Stop & Summarize": disconnect mic, POST `/api/summarize`, redirect to `/session/[id]`
- On mount: POST `/api/sessions` to create the session and get the `session_id`
- Each transcript chunk received → POST `/api/transcripts`

### app/upload/page.tsx

- Client Component
- Drag-and-drop + file picker for PDF (orange theme)
- Title + subject inputs
- On submit: POST `/api/upload-pdf` with FormData
- Show 4-step progress stepper while processing
- On success: redirect to `/session/[id]`

### app/session/[id]/page.tsx

- Server Component
- Fetch session + summary from Supabase
- If summary not ready: show processing state with auto-refresh
- Render `BentoGrid` with 4 tabs: Summary (OverviewCard + ConceptsCard), Flashcards (FlashcardDeck), Quiz (QuizCard), Chat
- Chat tab shows inline `ChatThread` + `ChatInput` (not a separate page)

### app/chat/[id]/page.tsx

- Client Component
- Full-page chat view (used when navigating directly to chat)
- Left panel (desktop): session context summary
- Right panel: `ChatThread` + `ChatInput`
- Uses `useChat(id)` hook

---

## COMPONENTS

### components/ui/Button.tsx

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'pdf'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}
// primary = blue, pdf = orange, danger = red, secondary = outlined, ghost = text only
// loading = spinner replaces children, button disabled
```

### components/ui/Badge.tsx

```typescript
interface BadgeProps {
  variant?: 'recording' | 'pdf' | 'done' | 'processing' | 'error' | 'alert' | 'ai'
  children: React.ReactNode
}
// recording = blue, pdf = orange, done = green, processing = amber spinner,
// error = red, alert = amber, ai = violet
```

### components/record/MicButton.tsx

```typescript
interface MicButtonProps {
  state: 'idle' | 'connecting' | 'recording' | 'processing'
  onClick: () => void
}
// idle: gray ring, mic icon
// connecting: slow blue pulse
// recording: 3 radiating blue rings, animated
// processing: spinner
```

### components/record/TranscriptViewer.tsx

```typescript
interface TranscriptChunk {
  text: string
  isAlert: boolean
  topicLabel?: string
}
interface TranscriptViewerProps {
  chunks: TranscriptChunk[]
}
// Each chunk fades in on appear
// Alert chunks: amber left border + amber text + bell icon
// Topic labels: violet pill above the chunk
// Auto-scrolls to bottom on new chunk
```

### components/session/FlashcardDeck.tsx

```typescript
interface FlashcardDeckProps {
  cards: Flashcard[]
}
// 3D flip on click/tap
// Swipe right = got it (green flash, removed from deck)
// Swipe left = still learning (stays)
// Progress bar
// Confetti on completion
// "Restart" button at end
```

### components/session/QuizCard.tsx

```typescript
interface QuizCardProps {
  questions: QuizQuestion[]
}
// One question at a time
// 4 tappable option cards
// Reveal correct/wrong after selection
// Score screen at end
```

---

## DESIGN TOKENS

Add these to `app/globals.css`:

```css
:root {
  --bg-base: #0D0F14;
  --bg-surface: #141720;
  --bg-elevated: #1C2030;
  --border: #2A2F42;
  --border-subtle: #3A3F55;

  --accent-blue: #4F8EF7;
  --accent-violet: #7C5CFC;
  --accent-orange: #F97316;
  --success: #34C77B;
  --warning: #F5A623;
  --danger: #E5484D;

  --text-primary: #F0F2F8;
  --text-secondary: #8B90A8;
  --text-muted: #4A4F68;

  --font-display: var(--font-syne);
  --font-body: var(--font-dm-sans);
  --font-mono: var(--font-jetbrains);
}
```

---

## CONNECTION MAP

This shows exactly what calls what — every connection in the app:

```
app/page.tsx
  → redirects to /dashboard or /login

app/(auth)/login/page.tsx
  → supabase.auth.signInWithOAuth (client)

app/dashboard/page.tsx
  → supabase.from('session_with_summary_status') (server)
  → <Sidebar /> <BottomNav /> <Badge /> <Button />

app/new/page.tsx
  → router.push('/record') or router.push('/upload')

app/record/page.tsx
  → POST /api/sessions (on mount)
  → useGeminiLive → lib/prompts.ts (LIVE_TRANSCRIBER_PROMPT)
  → useMicrophone → sendAudio via useGeminiLive
  → POST /api/transcripts (each chunk)
  → POST /api/summarize (on stop)
  → <MicButton /> <TranscriptViewer />

app/upload/page.tsx
  → POST /api/upload-pdf (FormData)

app/session/[id]/page.tsx
  → supabase.from('sessions') + supabase.from('summaries') (server)
  → <BentoGrid> → <OverviewCard> <ConceptsCard> <QuizCard> <FlashcardDeck>
  → useChat(id) for the chat tab

app/chat/[id]/page.tsx
  → useChat(id) → POST /api/chat
  → <ChatThread /> <ChatInput />

app/api/sessions/route.ts
  → lib/supabase/server.ts

app/api/transcripts/route.ts
  → lib/supabase/server.ts

app/api/summarize/route.ts
  → lib/supabase/server.ts
  → lib/gemini.ts → callGemini(SUMMARIZER_PROMPT)
  → lib/gemini.ts → callGemini(FLASHCARD_PROMPT)
  → lib/prompts.ts

app/api/upload-pdf/route.ts
  → lib/supabase/server.ts (Storage + DB)
  → lib/gemini.ts → callGemini(PDF_EXTRACTOR_PROMPT)
  → lib/prompts.ts

app/api/chat/route.ts
  → lib/supabase/server.ts
  → lib/gemini.ts → callGeminiChat(CHAT_PROMPT)
  → lib/prompts.ts
```

---

## WHAT TO GENERATE

Generate every file in the folder structure above, complete and ready to run.
Start in this order to avoid import errors:

1. `types/database.ts` and `types/api.ts`
2. `lib/prompts.ts` (full prompt text from agent prompts doc)
3. `lib/utils.ts`
4. `lib/supabase/server.ts` and `lib/supabase/client.ts`
5. `lib/gemini.ts`
6. `hooks/useGeminiLive.ts` (use exact code from HOOKS section above)
7. `hooks/useMicrophone.ts`
8. `hooks/useChat.ts`
9. All `components/ui/*`
10. All `components/layout/*`
11. All `components/record/*`
12. All `components/session/*`
13. All `components/chat/*`
14. All `app/api/*/route.ts`
15. All `app/**/page.tsx` and `app/layout.tsx`
16. Config files: `tailwind.config.ts`, `next.config.ts`, `tsconfig.json`

---

*Scribe — Master Rebuild Prompt v1.0*
*Stack: Next.js 14 · Supabase · Gemini 2.0/2.5 · TypeScript · Tailwind CSS*
