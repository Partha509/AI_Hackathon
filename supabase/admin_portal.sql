-- ========================================================================
-- FacultyOS — Administrator Portal Schema Migration
-- ========================================================================

-- 1. Ensure faculty_id exists on public.courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.profiles(id);

-- Link existing course CSE 321 to Dr. Tanvir Rahman if not set
UPDATE public.courses
SET faculty_id = 'a0000000-0000-0000-0000-000000000001'
WHERE id = 'cse-321' AND (faculty_id IS NULL OR faculty_id != 'a0000000-0000-0000-0000-000000000001');

-- 2. Create course_applications table
CREATE TABLE IF NOT EXISTS public.course_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ NULL,
  UNIQUE(student_id, course_id)
);

-- 3. Enable RLS and Open Policy
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Open access course_applications' 
    AND tablename = 'course_applications'
  ) THEN
    CREATE POLICY "Open access course_applications" 
      ON public.course_applications 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Seed sample applications for live demo
INSERT INTO public.course_applications (student_id, course_id, status, applied_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000003', 'cse-321', 'pending', NOW() - INTERVAL '2 hours')
ON CONFLICT (student_id, course_id) DO NOTHING;
