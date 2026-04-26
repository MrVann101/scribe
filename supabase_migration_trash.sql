-- Add soft delete column to sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update the view to exclude trashed sessions
CREATE OR REPLACE VIEW public.session_with_summary_status AS
SELECT 
  s.*,
  (sum.overview IS NOT NULL) as has_summary,
  (sum.flashcards IS NOT NULL AND jsonb_array_length(sum.flashcards) > 0) as has_flashcards,
  (sum.quiz IS NOT NULL AND jsonb_array_length(sum.quiz) > 0) as has_quiz
FROM public.sessions s
LEFT JOIN public.summaries sum ON s.id = sum.session_id
WHERE s.deleted_at IS NULL;

-- Create a separate view for trashed sessions
CREATE OR REPLACE VIEW public.session_trashed AS
SELECT 
  s.*,
  (sum.overview IS NOT NULL) as has_summary,
  (sum.flashcards IS NOT NULL AND jsonb_array_length(sum.flashcards) > 0) as has_flashcards,
  (sum.quiz IS NOT NULL AND jsonb_array_length(sum.quiz) > 0) as has_quiz
FROM public.sessions s
LEFT JOIN public.summaries sum ON s.id = sum.session_id
WHERE s.deleted_at IS NOT NULL;

-- Grant access
GRANT ALL ON public.session_trashed TO postgres, anon, authenticated, service_role;
