-- ========================================================================
-- FacultyOS — Course Applications (student → admin approval flow)
-- Run in the Supabase SQL Editor. Safe/idempotent to re-run.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.course_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open access course_applications" ON public.course_applications;
CREATE POLICY "Open access course_applications"
  ON public.course_applications FOR ALL USING (true) WITH CHECK (true);

-- Extra courses so the catalog has more than one option to browse/apply.
INSERT INTO public.courses (id, code, title, faculty_name, learning_objectives) VALUES
('cse-311', 'CSE 311', 'Database Systems', 'Dr. Tanvir Rahman', '[
  {"clo": "CLO1", "description": "Design normalized relational schemas", "blooms_level": "Apply"},
  {"clo": "CLO2", "description": "Write complex SQL queries and transactions", "blooms_level": "Apply"}
]'::jsonb),
('cse-411', 'CSE 411', 'Machine Learning', 'Lecturer Hasan Mahmud', '[
  {"clo": "CLO1", "description": "Apply supervised learning algorithms", "blooms_level": "Apply"},
  {"clo": "CLO2", "description": "Evaluate model performance and generalization", "blooms_level": "Evaluate"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
