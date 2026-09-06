-- ========================================================================
-- FacultyOS — Course Lifecycle & Anonymous Faculty Evaluation
-- Run via `npm run migrate supabase/course_lifecycle.sql`. Idempotent.
-- ========================================================================

-- 1. Course status (Active for the semester; Inactive once ended)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_status_chk;
ALTER TABLE public.courses ADD CONSTRAINT courses_status_chk
  CHECK (status IN ('active', 'inactive'));

-- 2. Final marks per enrolled student per course (precondition for ending)
CREATE TABLE IF NOT EXISTS public.final_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  marks NUMERIC(5,2) NOT NULL CHECK (marks BETWEEN 0 AND 100),
  letter_grade TEXT,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);
ALTER TABLE public.final_marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open access final_marks" ON public.final_marks;
CREATE POLICY "Open access final_marks" ON public.final_marks FOR ALL USING (true) WITH CHECK (true);

-- 3. Anonymous faculty evaluations (one per student per course)
CREATE TABLE IF NOT EXISTS public.faculty_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);
-- Anonymity is enforced at the API/query layer (faculty views expose only AVG),
-- since RLS here is permissive for the hackathon.
ALTER TABLE public.faculty_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open access faculty_evaluations" ON public.faculty_evaluations;
CREATE POLICY "Open access faculty_evaluations" ON public.faculty_evaluations FOR ALL USING (true) WITH CHECK (true);
