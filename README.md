# 📚 Scribe

> An AI-powered study companion for students — especially those with neurodivergent learning needs.

Scribe turns any lecture recording or PDF into a complete study guide — summary, flashcards, quiz, and chat — powered by Gemini AI. Built in 2.5 days for a hackathon.

---

## ✨ Main Features

### 🎙️ Live Recording
Record your lecture in real time. Scribe transcribes everything automatically and highlights exam alerts and topic shifts as they happen.

### 📄 PDF Upload
Upload any reviewer, handout, or textbook chapter. Scribe extracts the content and generates a full study guide in under 30 seconds.

### 📚 AI Study Guide
Every session automatically generates a summary, key concepts, flashcards, and a quiz — ready to study from immediately.

### 💬 Context-Aware Chat
Ask any question about the lecture or PDF. Scribe answers based only on what was actually taught.

### 🔄 Multi-Sensory Mode Switcher
Switch between four formats depending on how your brain works best:
- **Mind Map** — visual node graph for visual thinkers
- **Bionic Reading** — bolds the first letters of each word to help students with dyslexia read faster
- **Podcast Mode** — reads the summary aloud so students can study while moving

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 — dark mode |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — Google OAuth |
| Storage | Supabase Storage (PDF files) |
| AI — Live Transcription | Gemini 2.0 Flash Live (WebSocket) |
| AI — Study Guide + Chat | Gemini 2.5 Flash (REST) |
| Icons | Lucide React |
| Fonts | Syne · DM Sans · JetBrains Mono |

---

*Scribe — Hackathon 2026 · Tools for Neurodivergent Students · CDO Team*
