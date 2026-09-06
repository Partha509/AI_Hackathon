-- ========================================================================
-- FacultyOS — Admin User Provisioning, Semester Tracking & Session Settings
-- Fixed script with unique Student ID generation (avoids duplicate key error)
-- ========================================================================

-- 1. Extend profiles table with student_id_number and current_semester
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_id_number TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_semester TEXT 
CHECK (current_semester IN ('1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', 'Graduated'));

-- 2. Populate distinct Student ID Numbers and initial semester for each student
-- Uses ROW_NUMBER to guarantee distinct values (21.01.04.001, 21.01.04.002, etc.)
WITH numbered_students AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email ASC) as rn
  FROM public.profiles
  WHERE role = 'student'
)
UPDATE public.profiles p
SET 
  student_id_number = COALESCE(p.student_id_number, '21.01.04.' || LPAD((98 + ns.rn)::text, 3, '0')),
  current_semester = COALESCE(p.current_semester, '3.2')
FROM numbered_students ns
WHERE p.id = ns.id;

-- 3. Add UNIQUE constraint safely now that every student has a distinct ID
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_student_id_number_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_student_id_number_key UNIQUE (student_id_number);
  END IF;
END $$;

-- 4. Create system_settings table for global session tracking
CREATE TABLE IF NOT EXISTS public.system_settings (
  id SERIAL PRIMARY KEY,
  current_session TEXT NOT NULL DEFAULT 'Spring 2025',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default active session if empty
INSERT INTO public.system_settings (id, current_session)
VALUES (1, 'Spring 2025')
ON CONFLICT (id) DO UPDATE 
SET current_session = EXCLUDED.current_session;

-- 5. Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Open read system_settings' 
    AND tablename = 'system_settings'
  ) THEN
    CREATE POLICY "Open read system_settings" 
      ON public.system_settings 
      FOR SELECT 
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Open write system_settings' 
    AND tablename = 'system_settings'
  ) THEN
    CREATE POLICY "Open write system_settings" 
      ON public.system_settings 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;
