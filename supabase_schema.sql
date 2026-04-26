-- Supabase Schema for Scribe

-- 1. Create Sessions Table
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  source TEXT NOT NULL CHECK (source IN ('recording', 'pdf')),
  status TEXT NOT NULL CHECK (status IN ('recording', 'processing', 'done', 'error')),
  duration_sec INTEGER,
  pdf_path TEXT,
  pdf_name TEXT,
  page_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create Transcripts Table
CREATE TABLE public.transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_alert BOOLEAN DEFAULT FALSE NOT NULL,
  topic_label TEXT,
  source TEXT NOT NULL CHECK (source IN ('recording', 'pdf')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create Summaries Table
CREATE TABLE public.summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  overview TEXT,
  key_concepts JSONB, -- Array of { term: string, definition: string }
  action_items JSONB, -- Array of { text: string, due: string | null }
  quiz JSONB,         -- Array of { question: string, options: string[], answer: string }
  flashcards JSONB,   -- Array of { front: string, back: string, topic: string }
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create Chat Messages Table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Create View for Dashboard
CREATE OR REPLACE VIEW public.session_with_summary_status AS
SELECT 
  s.*,
  (sum.overview IS NOT NULL) as has_summary,
  (sum.flashcards IS NOT NULL AND jsonb_array_length(sum.flashcards) > 0) as has_flashcards,
  (sum.quiz IS NOT NULL AND jsonb_array_length(sum.quiz) > 0) as has_quiz
FROM public.sessions s
LEFT JOIN public.summaries sum ON s.id = sum.session_id;

-- 6. Setup Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- Policies for Transcripts
CREATE POLICY "Users can access transcripts of their sessions" ON public.transcripts
  FOR ALL USING (
    session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
  );

-- Policies for Summaries
CREATE POLICY "Users can access summaries of their sessions" ON public.summaries
  FOR ALL USING (
    session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
  );

-- Policies for Chat Messages
CREATE POLICY "Users can access chats of their sessions" ON public.chat_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
  );

-- 7. Create Storage Bucket for PDFs (Requires running as superuser, or do it via UI)
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload their own pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (string_to_array(name, '/'))[1]);
CREATE POLICY "Users can view their own pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs' AND auth.uid()::text = (string_to_array(name, '/'))[1]);
