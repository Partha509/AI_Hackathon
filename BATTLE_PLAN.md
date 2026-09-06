# FacultyOS — Hackathon Battle Plan
### AUST CSE Carnival <8.0/> — AI for Academic Life (Final Round)

⏱️ **Duration**: 5 Hours | **Primary Persona**: University Faculty (Co-Pilot, not replacement)  
🎯 **Core Philosophy**: **"One Useful Journey"** — Faculty gives input ➔ AI reasons, compares, and evaluates ➔ Faculty receives an actionable decision-support report.

---

## 1. Scope & Mark Strategy

| Priority | Feature / Skill | Purpose & Rubric Alignment |
|---|---|---|
| **TIER 1 (Must Have - 80%)** | **Exam Question Quality & Repetition Checker** | Evaluates syllabus coverage, question diversity, Bloom's/CLO alignment, and flags semantic repetition against past years' exams. |
| **TIER 1 (Must Have)** | **Multi-Grader Consistency Checker** | Compares evaluations of the same script by multiple faculty; flags grading variance and explains semantic reasoning gaps. |
| **TIER 1 (Must Have)** | **Student Grade Request Advisory** | Objectively re-evaluates student regrade petitions against the rubric to give faculty an unbiased second opinion. |
| **TIER 1 (Must Have)** | **Unified Faculty Co-Pilot Chatbot** | Central conversational front-door with tool/function calling that executes the above skills and queries live database records. |
| **TIER 2 (Differentiator - 20%)** | **Curriculum Overlap & Gap Analyzer** | Compares draft course syllabus against existing department courses to prevent duplicate content. |
| **TIER 2 (Differentiator)** | **Student Evaluation Sentiment Summarizer** | Extracts actionable teaching insights from raw semester student feedback. |

---

## 2. Team Roles & Ownership

| Team Member | Primary Tool | Responsibilities |
|---|---|---|
| **P1 (Frontend Lead)** | Copilot Agent (Opus) / VS Code | Next.js 15 App Shell, Tailwind v4 + shadcn/ui setup, Role-based Auth UI, Split-pane Comparison UI, Chatbot Drawer. |
| **P2 (Backend & UI Polish)** | Supabase + Antigravity (Gemini 3) | Full Postgres SQL schema, RLS policies, seed dataset (exams, multi-grader scripts, past questions), then visual polish pass in Antigravity. |
| **P3 (AI Intelligence Lead)** | Copilot Agent (Opus) / VS Code | LLM Tool Orchestration Layer (Gemini SDK / OpenAI API), Evaluation & Comparison algorithms, Structured JSON parsing for all 3 core skills. |

---

## 3. Hour-by-Hour Timeline & Go/No-Go Gates

- **0:00 – 0:30 [Scaffold & Schema]**: P2 runs Supabase SQL script + seeds data. P1 bootstraps Next.js + shadcn. P3 defines tool schemas.
- **0:30 – 1:45 [Core Skills 1 & 2]**: P3 builds Question Checker & Consistency Checker. P1 builds Chat UI + Dashboard.
- **1:45 – 2:45 [Core Skill 3 + Live Wiring]**: P3 completes Regrade Request skill. P1 & P3 connect API routes to real Supabase tables.
- **2:45 – 3:30 [End-to-End Testing Gate]**: Test the 3 core flows with seed data. **GO/NO-GO GATE**: If any core skill fails, FREEZE new features and fix it.
- **3:30 – 4:15 [Polish Pass]**: P2 runs Antigravity UI polish (badges, discrepancy highlights, loading states).
- **4:15 – 5:00 [Deploy & Demo Rehearsal]**: Deploy to Vercel, record 2-minute backup demo video, test judging script.

---

## 4. Supabase Database Schema (P2 — Run in Hour 0)

Paste this single block into your Supabase SQL Editor:

```sql
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles (Faculty, Student, Admin)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('faculty', 'student', 'admin')) DEFAULT 'faculty',
  department TEXT DEFAULT 'CSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Courses & Syllabi
CREATE TABLE public.courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  learning_objectives JSONB DEFAULT '[]', -- Array of { clo: string, description: string, blooms_level: string }
  faculty_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  topics JSONB NOT NULL DEFAULT '[]', -- Array of strings (e.g. ["Sorting", "Dynamic Programming", "Graphs"])
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Exams & Exam Questions (with Past Years)
CREATE TABLE public.exams (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL, -- e.g. "Spring 2024", "Fall 2025"
  exam_type TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'quiz')),
  total_marks INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  topic_tag TEXT NOT NULL,
  target_blooms TEXT DEFAULT 'Apply', -- Remember, Understand, Apply, Analyze, Evaluate, Create
  marks INT DEFAULT 10
);

-- 5. Multi-Grader Answer Scripts & Evaluation
CREATE TABLE public.answer_scripts (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  rubric_guidelines TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id TEXT REFERENCES public.answer_scripts(id) ON DELETE CASCADE,
  grader_name TEXT NOT NULL, -- e.g. "Dr. Tanvir (Lead)", "Lecturer Hasan (Co-Examiner)"
  score_awarded NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Grade Disputes / Regrade Requests
CREATE TABLE public.grade_requests (
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
CREATE TABLE public.chat_logs (
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
CREATE POLICY "Allow authenticated read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read syllabi" ON public.syllabi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read questions" ON public.exam_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read scripts" ON public.answer_scripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read grades" ON public.grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read grade_requests" ON public.grade_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated chat logs" ON public.chat_logs FOR ALL TO authenticated USING (true);
```

---

## 5. Seed Dataset (P2 — Run immediately after Schema)

```sql
-- Seed Courses
INSERT INTO public.courses (id, code, title, learning_objectives) VALUES
('cse-321', 'CSE 321', 'Algorithms', '[
  {"clo": "CLO1", "description": "Design and analyze divide-and-conquer and greedy algorithms", "blooms_level": "Analyze"},
  {"clo": "CLO2", "description": "Implement dynamic programming solutions for optimization problems", "blooms_level": "Apply"},
  {"clo": "CLO3", "description": "Prove NP-completeness and understand polynomial-time reductions", "blooms_level": "Evaluate"}
]');

-- Seed Syllabi Topics
INSERT INTO public.syllabi (course_id, topics) VALUES
('cse-321', '["Asymptotic Analysis", "Divide and Conquer", "Greedy Algorithms", "Dynamic Programming", "Graph Traversals (BFS/DFS)", "Minimum Spanning Trees", "NP-Completeness"]'::jsonb);

-- Past Year Exam (Fall 2024)
INSERT INTO public.exams (id, course_id, semester, exam_type, total_marks) VALUES
('exam-cse321-f24', 'cse-321', 'Fall 2024', 'final', 100),
('exam-cse321-s25', 'cse-321', 'Spring 2025', 'final', 100);

-- Past Exam Questions (Fall 2024) — Used to catch repetition!
INSERT INTO public.exam_questions (exam_id, question_number, question_text, topic_tag, target_blooms, marks) VALUES
('exam-cse321-f24', 1, 'Given an undirected connected graph G=(V,E) with positive edge weights, prove that if all edge weights are distinct, G has a unique Minimum Spanning Tree.', 'Minimum Spanning Trees', 'Analyze', 15),
('exam-cse321-f24', 2, 'Solve the 0/1 Knapsack problem using dynamic programming. Formulate the recurrence relation and analyze the time complexity.', 'Dynamic Programming', 'Apply', 15),
('exam-cse321-f24', 3, 'Define the classes P, NP, and NP-Complete. State Cook-Levin theorem.', 'NP-Completeness', 'Remember', 10);

-- Answer Script with Grader Discrepancy (Grader A vs Grader B)
INSERT INTO public.answer_scripts (id, exam_id, student_name, question_number, question_text, student_answer, rubric_guidelines) VALUES
('script-001', 'exam-cse321-s25', 'Sabbir Ahmed (ID: 21.01.04.099)', 2, 
'Derive the optimal substructure and write the pseudo-code for Longest Common Subsequence (LCS).',
'To find LCS between X and Y:
Let c[i,j] be the length of LCS of X[1..i] and Y[1..j].
If i=0 or j=0, c[i,j] = 0.
If X[i] == Y[j], then c[i,j] = c[i-1,j-1] + 1.
Else, c[i,j] = max(c[i-1,j], c[i,j-1]).
Time complexity is O(m*n). I omitted the backtrack table reconstruction code because time ran out, but the recurrence table computation is complete.',
'Full marks: 15. Breakdown: Recurrence definition (5 pts), Dynamic programming table computation logic (5 pts), Reconstruction/backtracking algorithm (5 pts).');

-- Grader Discrepancy Seed
INSERT INTO public.grades (script_id, grader_name, score_awarded, max_score, feedback) VALUES
('script-001', 'Dr. Tanvir (Head Grader)', 10.00, 15.00, 'Correct recurrence and table explanation. Deducted 5 marks for missing backtracking procedure as per rubric.'),
('script-001', 'Lecturer Hasan (Co-Examiner)', 4.00, 15.00, 'Incomplete answer. Failed to show full algorithm implementation and reconstruction. Awarded only token marks for formula.');

-- Seed Student Grade Dispute
INSERT INTO public.grade_requests (id, script_id, student_reason, status) VALUES
('req-101', 'script-001', 'I provided the exact recurrence relation and complexity analysis. 4/15 is extremely harsh considering 70% of the theoretical derivation was correct.', 'pending');
```
