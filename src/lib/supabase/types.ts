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
  student_id?: string | null;
  current_semester?: string | null;
  must_change_password?: boolean;
  is_active?: boolean;
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

// ── Student portal ────────────────────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface CourseApplication {
  id: string;
  student_id: string;
  course_id: string;
  status: ApplicationStatus;
  applied_at: string;
}

/** A graded answer script with its examiner grades and course context. */
export interface StudentGradedScript {
  script_id: string;
  exam_id: string;
  course_code: string;
  course_title: string;
  question_number: number;
  question_text: string;
  rubric_guidelines: string;
  grades: {
    grader_name: string;
    grader_role?: string;
    score_awarded: number;
    max_score: number;
    feedback: string;
  }[];
  appeal_status: GradeRequest["status"] | null;
}

/** A course in the catalog with the current student's application status. */
export interface CatalogCourse {
  id: string;
  code: string;
  title: string;
  faculty_name?: string;
  objectives_count: number;
  semester: string | null;
  can_apply: boolean;
  application_status: ApplicationStatus | null;
}

export interface StudentSummary {
  profile: Pick<Profile, "id" | "full_name" | "email" | "department">;
  approved_courses: number;
  pending_applications: number;
  graded_assessments: number;
}

// ── Admin / accounts / sessions ───────────────────────────────────────

export interface AppSettings {
  id: number;
  current_session: string;
  updated_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: "faculty" | "student" | "admin";
  department: string;
  student_id: string | null;
  current_semester: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface CreateUserInput {
  email: string;
  full_name: string;
  role: "faculty" | "student";
  department?: string;
  student_id?: string;
  current_semester?: string;
}

export interface CreateUserResult {
  id: string;
  email: string;
  invite_link: string;
}

export interface AdvanceSessionResult {
  new_session: string;
  advanced: number;
  graduated: number;
}

