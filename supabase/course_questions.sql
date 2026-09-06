-- ========================================================================
-- FacultyOS — Course Question Bank (short questions + previous-year archive)
-- Run in the Supabase SQL Editor or via `npm run migrate`. Idempotent.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.course_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  topic TEXT,
  marks INT NOT NULL DEFAULT 5,
  -- How the question was produced.
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'source_material')),
  -- true = archived previous-year question; false = current/new question.
  is_previous BOOLEAN NOT NULL DEFAULT FALSE,
  session TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_questions_course ON public.course_questions (course_id);

ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open access course_questions" ON public.course_questions;
CREATE POLICY "Open access course_questions"
  ON public.course_questions FOR ALL USING (true) WITH CHECK (true);
