export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  auth_user_id?: string | null;
  email: string;
  full_name: string;
  role: "faculty" | "student" | "admin";
  department: string;
  created_at: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty_name?: string;
  assigned_faculty?: {
    faculty_id?: string;
    name: string;
    email?: string;
    role?: string;
  }[];
  enrolled_count?: number;
  enrolled_students?: {
    student_id: string;
    student_name: string;
    email?: string;
    semester?: string;
    status?: string;
  }[];
  learning_objectives: {
    clo: string;
    description: string;
    blooms_level: string;
  }[];
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  student_id_number: string;
  student_name: string;
  semester: string;
  status: "enrolled" | "dropped" | "completed";
  enrolled_at: string;
}

export interface Syllabus {
  id: string;
  course_id: string;
  topics: string[];
  updated_at: string;
}

export interface Exam {
  id: string;
  course_id: string;
  semester: string;
  exam_type: "midterm" | "final" | "quiz";
  total_marks: number;
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_number: number;
  question_text: string;
  topic_tag: string;
  target_blooms: string;
  marks: number;
}

export interface AnswerScript {
  id: string;
  exam_id: string;
  student_name: string;
  student_id_number: string;
  question_number: number;
  question_text: string;
  student_answer: string;
  rubric_guidelines: string;
  created_at: string;
}

export interface Grade {
  id: string;
  script_id: string;
  grader_name: string;
  grader_role?: string;
  score_awarded: number;
  max_score: number;
  feedback: string;
  graded_at: string;
}

export interface GradeRequest {
  id: string;
  script_id: string;
  student_name: string;
  student_reason: string;
  status: "pending" | "under_review" | "resolved";
  ai_recommendation?: {
    recommendation: string;
    suggested_score?: number;
    suggested_delta?: number;
    confidence_score?: number;
    reasoning?: string;
    policy_flag?: string;
    rubric_audit?: Record<string, { awarded: number; max: number; status: string }>;
  };
  faculty_decision?: string;
  created_at: string;
}

export interface ChatLog {
  id: string;
  user_id?: string;
  skill_used: string;
  user_prompt: string;
  ai_response: Json;
  created_at: string;
}
