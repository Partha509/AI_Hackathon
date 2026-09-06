-- ========================================================================
-- FacultyOS — Supabase Seed Dataset (P2)
-- AUST CSE Carnival <8.0/> — AI for Academic Life
-- ========================================================================

-- Seed Courses
INSERT INTO public.courses (id, code, title, learning_objectives) VALUES
('cse-321', 'CSE 321', 'Algorithms', '[
  {"clo": "CLO1", "description": "Design and analyze divide-and-conquer and greedy algorithms", "blooms_level": "Analyze"},
  {"clo": "CLO2", "description": "Implement dynamic programming solutions for optimization problems", "blooms_level": "Apply"},
  {"clo": "CLO3", "description": "Prove NP-completeness and understand polynomial-time reductions", "blooms_level": "Evaluate"}
]')
ON CONFLICT (id) DO NOTHING;

-- Seed Syllabi Topics
INSERT INTO public.syllabi (course_id, topics) VALUES
('cse-321', '["Asymptotic Analysis", "Divide and Conquer", "Greedy Algorithms", "Dynamic Programming", "Graph Traversals (BFS/DFS)", "Minimum Spanning Trees", "NP-Completeness"]'::jsonb);

-- Past Year Exam (Fall 2024) and Current Exam (Spring 2025)
INSERT INTO public.exams (id, course_id, semester, exam_type, total_marks) VALUES
('exam-cse321-f24', 'cse-321', 'Fall 2024', 'final', 100),
('exam-cse321-s25', 'cse-321', 'Spring 2025', 'final', 100)
ON CONFLICT (id) DO NOTHING;

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
'Full marks: 15. Breakdown: Recurrence definition (5 pts), Dynamic programming table computation logic (5 pts), Reconstruction/backtracking algorithm (5 pts).')
ON CONFLICT (id) DO NOTHING;

-- Grader Discrepancy Seed
INSERT INTO public.grades (script_id, grader_name, score_awarded, max_score, feedback) VALUES
('script-001', 'Dr. Tanvir (Head Grader)', 10.00, 15.00, 'Correct recurrence and table explanation. Deducted 5 marks for missing backtracking procedure as per rubric.'),
('script-001', 'Lecturer Hasan (Co-Examiner)', 4.00, 15.00, 'Incomplete answer. Failed to show full algorithm implementation and reconstruction. Awarded only token marks for formula.');

-- Seed Student Grade Dispute
INSERT INTO public.grade_requests (id, script_id, student_reason, status) VALUES
('req-101', 'script-001', 'I provided the exact recurrence relation and complexity analysis. 4/15 is extremely harsh considering 70% of the theoretical derivation was correct.', 'pending');
