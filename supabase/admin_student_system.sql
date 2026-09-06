-- ========================================================================
-- FacultyOS — Admin-managed accounts, semesters & sessions
-- Run in the Supabase SQL Editor. Safe/idempotent to re-run.
-- ========================================================================

-- 1. PROFILE EXTENSIONS: admin-issued student ID, semester, invite state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_semester TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- student_id is unique when present
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_student_id
  ON public.profiles (student_id) WHERE student_id IS NOT NULL;

-- Valid semesters only (1.1 … 4.2), or null for non-students
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_current_semester_chk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_current_semester_chk
  CHECK (current_semester IS NULL OR current_semester IN
    ('1.1','1.2','2.1','2.2','3.1','3.2','4.1','4.2'));

-- 2. APP SETTINGS: single-row table holding the current academic session
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  current_session TEXT NOT NULL DEFAULT 'Spring 2025',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);
INSERT INTO public.app_settings (id, current_session)
  VALUES (1, 'Spring 2025')
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open access app_settings" ON public.app_settings;
CREATE POLICY "Open access app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. COURSE APPLICATIONS (student → admin approval; idempotent create)
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

-- 4. EXTRA COURSES across semesters so the catalog spans years
--    (semester is derived from the first two digits of the code: CSE 3xx → 3.x)
INSERT INTO public.courses (id, code, title, faculty_name, learning_objectives) VALUES
('cse-311', 'CSE 311', 'Database Systems', 'Dr. Tanvir Rahman', '[
  {"clo": "CLO1", "description": "Design normalized relational schemas", "blooms_level": "Apply"}
]'::jsonb),
('cse-321', 'CSE 321', 'Algorithms', 'Dr. Tanvir Rahman', '[]'::jsonb),
('cse-411', 'CSE 411', 'Machine Learning', 'Lecturer Hasan Mahmud', '[
  {"clo": "CLO1", "description": "Apply supervised learning algorithms", "blooms_level": "Apply"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
