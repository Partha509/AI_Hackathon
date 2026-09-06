import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reads a compact snapshot of key tables to ground the faculty chatbot.
 * Uses the service-role client (server-only) so it can read across tables.
 * Kept bounded so it fits comfortably in the prompt.
 */
export async function getFacultyDbContext(): Promise<string> {
  const db = createAdminClient();

  const [courses, exams, scripts, grades, requests, profiles] = await Promise.all([
    db.from("courses").select("code, title, faculty_name").limit(50),
    db.from("exams").select("id, course_id, semester, exam_type, total_marks").limit(50),
    db.from("answer_scripts").select("id, exam_id, student_name, question_number").limit(50),
    db.from("grades").select("script_id, grader_name, score_awarded, max_score").limit(100),
    db
      .from("grade_requests")
      .select("id, script_id, student_name, status")
      .limit(50),
    db.from("profiles").select("role").limit(1000),
  ]);

  const roleCounts = (profiles.data ?? []).reduce<Record<string, number>>((acc, p) => {
    const r = (p as { role?: string }).role ?? "unknown";
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  const lines: string[] = [];
  lines.push("== FacultyOS live database snapshot ==");
  lines.push(
    `Users by role: ${Object.entries(roleCounts)
      .map(([r, c]) => `${r}=${c}`)
      .join(", ") || "none"}`
  );

  lines.push(`\nCourses (${courses.data?.length ?? 0}):`);
  for (const c of courses.data ?? []) {
    lines.push(`- ${c.code}: ${c.title} (faculty: ${c.faculty_name ?? "—"})`);
  }

  lines.push(`\nExams (${exams.data?.length ?? 0}):`);
  for (const e of exams.data ?? []) {
    lines.push(`- ${e.id}: course ${e.course_id}, ${e.semester} ${e.exam_type}, /${e.total_marks}`);
  }

  lines.push(`\nAnswer scripts (${scripts.data?.length ?? 0}):`);
  for (const sc of scripts.data ?? []) {
    lines.push(`- ${sc.id}: ${sc.student_name}, exam ${sc.exam_id}, Q${sc.question_number}`);
  }

  lines.push(`\nGrades (${grades.data?.length ?? 0}):`);
  for (const g of grades.data ?? []) {
    lines.push(`- script ${g.script_id}: ${g.grader_name} ${g.score_awarded}/${g.max_score}`);
  }

  lines.push(`\nGrade/regrade requests (${requests.data?.length ?? 0}):`);
  for (const r of requests.data ?? []) {
    lines.push(`- ${r.id}: ${r.student_name} (script ${r.script_id}) — ${r.status}`);
  }

  return lines.join("\n");
}
