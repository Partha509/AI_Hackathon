-- ========================================================================
-- FacultyOS — Production-Ready Database Schema & Seed Data
-- AUST CSE Carnival <8.0/> — AI Academic Decision-Support Co-Pilot
-- Target: Supabase SQL Editor (Single Contiguous Script)
-- ========================================================================

-- 0. CLEAN RESET (Ensures idempotent execution with zero schema conflicts)
DROP TABLE IF EXISTS public.chat_logs CASCADE;
DROP TABLE IF EXISTS public.grade_requests CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.answer_scripts CASCADE;
DROP TABLE IF EXISTS public.exam_questions CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.syllabi CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================
-- 2. TABLE DEFINITIONS
-- ========================================================================

-- 2.1 Profiles Table (Faculty, Student, Admin)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('faculty', 'student', 'admin')) DEFAULT 'faculty',
  department TEXT DEFAULT 'CSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Courses & Syllabi Tables
CREATE TABLE public.courses (
  id TEXT PRIMARY KEY, -- e.g. 'cse-321'
  code TEXT NOT NULL UNIQUE, -- e.g. 'CSE 321'
  title TEXT NOT NULL, -- e.g. 'Algorithms'
  learning_objectives JSONB DEFAULT '[]'::jsonb, -- Array of { clo, description, blooms_level }
  faculty_name TEXT DEFAULT 'Dr. Tanvir Rahman',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings (Syllabus topic universe)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Exams & Exam Questions Tables (with Past Archive Support)
CREATE TABLE public.exams (
  id TEXT PRIMARY KEY, -- e.g. 'exam-cse321-f24', 'exam-cse321-s25'
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL, -- e.g. 'Fall 2024', 'Spring 2025'
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

-- 2.4 Answer Scripts & Multi-Faculty Grades Tables
CREATE TABLE public.answer_scripts (
  id TEXT PRIMARY KEY, -- e.g. 'script-001'
  exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id_number TEXT NOT NULL, -- e.g. '21.01.04.099'
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  rubric_guidelines TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id TEXT REFERENCES public.answer_scripts(id) ON DELETE CASCADE,
  grader_name TEXT NOT NULL, -- e.g. 'Dr. Tanvir Rahman', 'Lecturer Hasan Mahmud'
  grader_role TEXT DEFAULT 'Examiner', -- 'Head Grader', 'Co-Examiner', 'Moderator'
  score_awarded NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Student Grade Disputes Table (Regrade Requests)
CREATE TABLE public.grade_requests (
  id TEXT PRIMARY KEY, -- e.g. 'req-101'
  script_id TEXT REFERENCES public.answer_scripts(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'under_review', 'resolved')) DEFAULT 'pending',
  ai_recommendation JSONB NULL, -- { recommendation, confidence, reasoning, suggested_delta, proposed_score }
  faculty_decision TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Chat Logs Table (Conversational Front-Door & Tool Audit Feed)
CREATE TABLE public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  skill_used TEXT NOT NULL, -- 'QuestionQualityChecker', 'ConsistencyAnalyzer', 'RegradeArbitrator'
  user_prompt TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 3. SECURITY & ROW LEVEL SECURITY (RLS)
-- ========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Open permissive policies for rapid hackathon execution & judge demo
CREATE POLICY "Open access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access syllabi" ON public.syllabi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access exam_questions" ON public.exam_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access answer_scripts" ON public.answer_scripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access grade_requests" ON public.grade_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access chat_logs" ON public.chat_logs FOR ALL USING (true) WITH CHECK (true);

-- ========================================================================
-- 4. REALISTIC HACKATHON SEED DATASET (LIVE JUDGING READY)
-- ========================================================================

-- 4.1 Profiles (Faculty & Student)
INSERT INTO public.profiles (id, email, full_name, role, department) VALUES
('a0000000-0000-0000-0000-000000000001', 'tanvir.cse@aust.edu', 'Dr. Tanvir Rahman', 'faculty', 'CSE'),
('a0000000-0000-0000-0000-000000000002', 'hasan.cse@aust.edu', 'Lecturer Hasan Mahmud', 'faculty', 'CSE'),
('a0000000-0000-0000-0000-000000000003', 'sabbir.210104099@aust.edu', 'Sabbir Ahmed', 'student', 'CSE');

-- 4.2 Course: CSE 321 (Algorithms)
INSERT INTO public.courses (id, code, title, faculty_name, learning_objectives) VALUES
('cse-321', 'CSE 321', 'Algorithms', 'Dr. Tanvir Rahman', '[
  {"clo": "CLO1", "description": "Design and analyze divide-and-conquer and greedy algorithms with asymptotic tightness", "blooms_level": "Analyze"},
  {"clo": "CLO2", "description": "Formulate and implement optimal dynamic programming recurrences for multi-stage decisions", "blooms_level": "Apply"},
  {"clo": "CLO3", "description": "Prove graph properties, cut-property theorems, and polynomial-time NP-reductions", "blooms_level": "Evaluate"}
]'::jsonb);

-- 4.3 Syllabus Topics: 7 Core Topics
INSERT INTO public.syllabi (course_id, topics) VALUES
('cse-321', '[
  "Asymptotic Analysis & Recurrences",
  "Divide and Conquer",
  "Greedy Algorithms",
  "Dynamic Programming",
  "Graph Traversals (BFS/DFS)",
  "Minimum Spanning Trees (Kruskal/Prim)",
  "NP-Completeness & Reductions"
]'::jsonb);

-- 4.4 Exams: Fall 2024 (Past Archive) and Spring 2025 (Current Evaluation)
INSERT INTO public.exams (id, course_id, semester, exam_type, total_marks) VALUES
('exam-cse321-f24', 'cse-321', 'Fall 2024', 'final', 100),
('exam-cse321-s25', 'cse-321', 'Spring 2025', 'final', 100);

-- 4.5 Past Exam Questions (Fall 2024) — Repetition Detection Benchmark
INSERT INTO public.exam_questions (exam_id, question_number, question_text, topic_tag, target_blooms, marks) VALUES
('exam-cse321-f24', 1, 'Given an undirected connected graph G=(V,E) with positive edge weights, prove that if all edge weights are distinct, G has a unique Minimum Spanning Tree (MST).', 'Minimum Spanning Trees (Kruskal/Prim)', 'Analyze', 15),
('exam-cse321-f24', 2, 'Solve the 0/1 Knapsack problem using dynamic programming. Formulate the recurrence relation, draw the computation table for capacity W=10, and analyze the asymptotic time complexity.', 'Dynamic Programming', 'Apply', 15),
('exam-cse321-f24', 3, 'Define the complexity classes P, NP, and NP-Complete. Formally state the Cook-Levin theorem and demonstrate polynomial-time verifiability.', 'NP-Completeness & Reductions', 'Remember', 10);

-- 4.6 Current Exam Questions Draft (Spring 2025)
INSERT INTO public.exam_questions (exam_id, question_number, question_text, topic_tag, target_blooms, marks) VALUES
('exam-cse321-s25', 1, 'In an undirected weighted graph where all edge costs are strictly unique, prove whether there can exist more than one distinct Minimum Spanning Tree. Justify using the Cut Property.', 'Minimum Spanning Trees (Kruskal/Prim)', 'Analyze', 15),
('exam-cse321-s25', 2, 'Derive the optimal substructure and write the pseudo-code for Longest Common Subsequence (LCS). Trace the table and reconstruct the string.', 'Dynamic Programming', 'Apply', 15);

-- 4.7 Student Answer Script with Multi-Examiner Discrepancy (script-001)
INSERT INTO public.answer_scripts (
  id, exam_id, student_name, student_id_number, question_number, question_text, student_answer, rubric_guidelines
) VALUES (
  'script-001',
  'exam-cse321-s25',
  'Sabbir Ahmed',
  '21.01.04.099',
  2,
  'Derive the optimal substructure and write the pseudo-code for Longest Common Subsequence (LCS).',
  'To find LCS between strings X of length m and Y of length n:
1. Optimal Substructure:
Let c[i,j] be the length of LCS of prefixes X[1..i] and Y[1..j].
Base cases:
If i == 0 or j == 0: c[i,j] = 0.
Recursive cases:
If X[i] == Y[j]: c[i,j] = c[i-1,j-1] + 1.
If X[i] != Y[j]: c[i,j] = max(c[i-1,j], c[i,j-1]).

2. Table Construction:
Allocate table c[0..m, 0..n]. Fill row by row using nested loops for i=1..m and j=1..n.
Time complexity is O(m*n), space complexity is O(m*n).

Note: I ran out of examination time before finishing the recursive backtrack table printing routine, but the full recurrence and dynamic table formulation are complete and correct above.',
  'Total Marks: 15.
- Recurrence Definition & Optimal Substructure Formulation: 5 Points
- Dynamic Programming Table Computation Logic & Complexity: 5 Points
- Backtracking / Solution String Reconstruction Algorithm: 5 Points'
);

-- 4.8 Dual Examiner Evaluation (Significant Discrepancy: 10.0 vs 4.0)
INSERT INTO public.grades (script_id, grader_name, grader_role, score_awarded, max_score, feedback) VALUES
(
  'script-001',
  'Dr. Tanvir Rahman',
  'Head Grader',
  10.00,
  15.00,
  'Sound understanding of optimal substructure and recurrence derivation. Dynamic programming table logic is fully sound. Deducted 5 marks for omitted backtracking algorithm as required by rubric.'
),
(
  'script-001',
  'Lecturer Hasan Mahmud',
  'Co-Examiner',
  4.00,
  15.00,
  'Answer is incomplete. Failed to write full implementation and missing entire reconstruction algorithm. Only token points granted for recurrence.'
);

-- 4.9 Student Grade Dispute Petition with Pre-Calculated AI Recommendation
INSERT INTO public.grade_requests (
  id,
  script_id,
  student_name,
  student_reason,
  status,
  ai_recommendation,
  faculty_decision
) VALUES (
  'req-101',
  'script-001',
  'Sabbir Ahmed',
  'I provided the complete formal recurrence relation and full DP table computation logic with complexity proofs (Sections 1 & 2 of rubric). Receiving only 4/15 is disproportionately harsh when 10/15 points of the rubric were fully satisfied.',
  'pending',
  '{
    "recommendation": "UPHOLD_APPEAL",
    "suggested_score": 10.00,
    "suggested_delta": 6.00,
    "confidence_score": 0.94,
    "rubric_audit": {
      "recurrence_definition": {"awarded": 5.0, "max": 5.0, "status": "VERIFIED"},
      "table_computation": {"awarded": 5.0, "max": 5.0, "status": "VERIFIED"},
      "backtracking_reconstruction": {"awarded": 0.0, "max": 5.0, "status": "OMITTED_DEFICIT"}
    },
    "reasoning": "Student script demonstrates mathematically precise derivation of optimal substructure and recurrence equation matching CLO2. The -11 deduction by Examiner 2 severely breaches rubric proportionality. Head Grader assessment (10.0/15.0) is objective and aligned with grading benchmarks.",
    "policy_flag": "GRADER_VARIANCE_ANOMALY (Δ 40%)"
  }'::jsonb,
  NULL
);

-- 4.10 Seed Chat Log (Faculty Co-Pilot Audit Trail)
INSERT INTO public.chat_logs (skill_used, user_prompt, ai_response) VALUES
(
  'ConsistencyAnalyzer',
  'Analyze grading discrepancy on student script Sabbir Ahmed (script-001)',
  '{
    "script_id": "script-001",
    "examiner_1": {"name": "Dr. Tanvir Rahman", "score": 10.0, "weight": "66.7%"},
    "examiner_2": {"name": "Lecturer Hasan Mahmud", "score": 4.0, "weight": "26.7%"},
    "variance_delta": 6.0,
    "discrepancy_percentage": 40.0,
    "severity": "CRITICAL",
    "root_cause": "Examiner 2 penalized omitted section by 11 marks instead of rubric maximum 5 marks",
    "recommended_action": "Align score with Head Grader baseline (10.0/15.0)"
  }'::jsonb
);

-- ========================================================================
-- 5. VERIFICATION VALIDATION SUITE
-- ========================================================================

SELECT 
  'Verification Summary' as check_title,
  (SELECT count(*) FROM public.profiles) as profiles_count,
  (SELECT count(*) FROM public.courses) as courses_count,
  (SELECT count(*) FROM public.syllabi) as syllabi_count,
  (SELECT count(*) FROM public.exams) as exams_count,
  (SELECT count(*) FROM public.exam_questions) as questions_count,
  (SELECT count(*) FROM public.answer_scripts) as scripts_count,
  (SELECT count(*) FROM public.grades) as grades_count,
  (SELECT count(*) FROM public.grade_requests) as disputes_count,
  (SELECT count(*) FROM public.chat_logs) as chat_logs_count;
