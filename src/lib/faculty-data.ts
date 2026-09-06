import type { Course, Exam, ExamQuestion, Profile } from "@/lib/supabase/types";

export type { Course, Exam, ExamQuestion, Profile };

const TERM_ORDER: Record<string, number> = {
  winter: 0,
  spring: 1,
  summer: 2,
  fall: 3,
  autumn: 3,
};

/** Numeric rank so the most recent academic term sorts highest (e.g. Spring 2025 > Fall 2024). */
export function semesterRank(semester: string | undefined | null): number {
  const m = /(spring|summer|fall|autumn|winter)\s+(\d{4})/i.exec(semester ?? "");
  if (!m) return 0;
  return parseInt(m[2], 10) * 10 + (TERM_ORDER[m[1].toLowerCase()] ?? 0);
}

/** A course belongs to a faculty member if they are an assigned examiner or the named instructor. */
export function isCourseForFaculty(course: Course, profile: Pick<Profile, "id" | "email" | "full_name">): boolean {
  const byAssigned = course.assigned_faculty?.some(
    (f) => (f.faculty_id && f.faculty_id === profile.id) || (f.email && f.email === profile.email)
  );
  const byName = Boolean(course.faculty_name && course.faculty_name === profile.full_name);
  return Boolean(byAssigned || byName);
}

/** Students with an approved/enrolled status on a course. */
export function approvedStudents(course: Course) {
  return (course.enrolled_students ?? []).filter(
    (s) => !s.status || s.status === "enrolled" || s.status === "approved" || s.status === "completed"
  );
}

/** The most recent semester across a set of exams, or a sensible default. */
export function currentSemester(exams: Exam[]): string {
  if (exams.length === 0) return "Spring 2025";
  return exams.reduce((best, e) => (semesterRank(e.semester) > semesterRank(best.semester) ? e : best)).semester;
}
