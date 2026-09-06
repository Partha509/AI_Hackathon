-- ========================================================================
-- FacultyOS — Supabase Database Schema (P2)
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('faculty', 'student', 'admin')) DEFAULT 'faculty',
  department TEXT DEFAULT 'CSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  learning_objectives JSONB DEFAULT '[]',
  faculty_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  topics JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'quiz')),
  total_marks INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  topic_tag TEXT NOT NULL,
  target_blooms TEXT DEFAULT 'Apply',
  marks INT DEFAULT 10
);

CREATE TABLE IF NOT EXISTS public.answer_scripts (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  rubric_guidelines TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id TEXT REFERENCES public.answer_scripts(id) ON DELETE CASCADE,
  grader_name TEXT NOT NULL,
  score_awarded NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  script_id TEXT REFERENCES public.answer_scripts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id),
  student_reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'under_review', 'resolved')) DEFAULT 'pending',
  ai_recommendation JSONB,
  faculty_decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  skill_used TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read courses' AND tablename = 'courses') THEN
    CREATE POLICY "Allow public read courses" ON public.courses FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read syllabi' AND tablename = 'syllabi') THEN
    CREATE POLICY "Allow public read syllabi" ON public.syllabi FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read exams' AND tablename = 'exams') THEN
    CREATE POLICY "Allow public read exams" ON public.exams FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Allow public read questions" ON public.exam_questions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read scripts' AND tablename = 'answer_scripts') THEN
    CREATE POLICY "Allow public read scripts" ON public.answer_scripts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read grades' AND tablename = 'grades') THEN
    CREATE POLICY "Allow public read grades" ON public.grades FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read grade_requests' AND tablename = 'grade_requests') THEN
    CREATE POLICY "Allow public read grade_requests" ON public.grade_requests FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public chat logs' AND tablename = 'chat_logs') THEN
    CREATE POLICY "Allow public chat logs" ON public.chat_logs FOR ALL USING (true);
  END IF;
END $$;
