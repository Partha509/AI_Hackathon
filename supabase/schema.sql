-- ========================================================================
-- FacultyOS — Supabase Database Schema (P2)
-- AUST CSE Carnival <8.0/> — AI for Academic Life
-- ========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles (Faculty, Student, Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('faculty', 'student', 'admin')) DEFAULT 'faculty',
  department TEXT DEFAULT 'CSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Courses & Syllabi
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  learning_objectives JSONB DEFAULT '[]', -- Array of { clo: string, description: string, blooms_level: string }
  faculty_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  topics JSONB NOT NULL DEFAULT '[]', -- Array of strings (e.g. ["Sorting", "Dynamic Programming", "Graphs"])
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Exams & Exam Questions (with Past Years)
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL, -- e.g. "Spring 2024", "Fall 2025"
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
  target_blooms TEXT DEFAULT 'Apply', -- Remember, Understand, Apply, Analyze, Evaluate, Create
  marks INT DEFAULT 10
);

-- 5. Multi-Grader Answer Scripts & Evaluation
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
  grader_name TEXT NOT NULL, -- e.g. "Dr. Tanvir (Lead)", "Lecturer Hasan (Co-Examiner)"
  score_awarded NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Grade Disputes / Regrade Requests
CREATE TABLE IF NOT EXISTS public.grade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id TEXT REFERENCES public.answer_scripts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id),
  student_reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'under_review', 'resolved')) DEFAULT 'pending',
  ai_recommendation JSONB, -- { recommendation: string, confidence: number, reasoning: string, suggested_delta: number }
  faculty_decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat Logs / Skill Audit Feed
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  skill_used TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Permissive authenticated access for rapid hackathon execution
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read' AND tablename = 'profiles') THEN
    CREATE POLICY "Allow authenticated read" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read courses' AND tablename = 'courses') THEN
    CREATE POLICY "Allow authenticated read courses" ON public.courses FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read syllabi' AND tablename = 'syllabi') THEN
    CREATE POLICY "Allow authenticated read syllabi" ON public.syllabi FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read exams' AND tablename = 'exams') THEN
    CREATE POLICY "Allow authenticated read exams" ON public.exams FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Allow authenticated read questions" ON public.exam_questions FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read scripts' AND tablename = 'answer_scripts') THEN
    CREATE POLICY "Allow authenticated read scripts" ON public.answer_scripts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read grades' AND tablename = 'grades') THEN
    CREATE POLICY "Allow authenticated read grades" ON public.grades FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read grade_requests' AND tablename = 'grade_requests') THEN
    CREATE POLICY "Allow authenticated read grade_requests" ON public.grade_requests FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated chat logs' AND tablename = 'chat_logs') THEN
    CREATE POLICY "Allow authenticated chat logs" ON public.chat_logs FOR ALL TO authenticated USING (true);
  END IF;
END $$;
