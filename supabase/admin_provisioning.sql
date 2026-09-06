-- ========================================================================
-- FacultyOS — Admin User Provisioning, Semester Tracking & Session Settings
-- ========================================================================

-- 1. Extend profiles with Student ID Number and Current Semester
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_id_number TEXT UNIQUE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_semester TEXT 
CHECK (current_semester IN ('1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', 'Graduated'));

-- 2. Create system_settings table for global session tracking
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

-- 3. Enable RLS on system_settings
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

-- 4. Populate existing student accounts with initial semester and ID numbers
UPDATE public.profiles
SET 
  student_id_number = COALESCE(student_id_number, '21.01.04.099'),
  current_semester = COALESCE(current_semester, '3.2')
WHERE role = 'student' AND (student_id_number IS NULL OR current_semester IS NULL);
