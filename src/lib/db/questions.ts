import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CourseQuestion, QuestionSource } from "@/lib/supabase/types";

async function resolveCourse(codeOrId: string) {
  const admin = createAdminClient();
  const value = codeOrId.trim();
  // Try by code (case-insensitive), then by id.
  const byCode = await admin.from("courses").select("id, code, title").ilike("code", value).maybeSingle();
  if (byCode.data) return byCode.data;
  const byId = await admin
    .from("courses")
    .select("id, code, title")
    .eq("id", value.toLowerCase().replace(/\s+/g, "-"))
    .maybeSingle();
  return byId.data ?? null;
}

/** Returns a course's question bank (previous + current), newest first. */
export async function listCourseQuestions(
  courseCode: string
): Promise<{ course: { id: string; code: string; title: string }; questions: CourseQuestion[] }> {
  const course = await resolveCourse(courseCode);
  if (!course) throw new Error(`No course found with code "${courseCode}".`);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_questions")
    .select("*")
    .eq("course_id", course.id)
    .order("is_previous", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load questions: " + error.message);

  return { course, questions: (data ?? []) as CourseQuestion[] };
}

/** Adds one or more short questions to a course's bank. */
export async function addCourseQuestions(input: {
  courseCode: string;
  questions: { text: string; topic?: string; marks?: number }[];
  source?: QuestionSource;
  createdBy?: string | null;
  isPrevious?: boolean;
  session?: string;
}): Promise<{ course_code: string; added: number; questions: CourseQuestion[] }> {
  const course = await resolveCourse(input.courseCode);
  if (!course) throw new Error(`No course found with code "${input.courseCode}".`);

  const rows = (input.questions ?? [])
    .filter((q) => q.text?.trim())
    .map((q) => ({
      course_id: course.id,
      question_text: q.text.trim(),
      topic: q.topic?.trim() || null,
      marks: q.marks ?? 5,
      source: input.source ?? "manual",
      is_previous: input.isPrevious ?? false,
      session: input.session ?? null,
      created_by: input.createdBy ?? null,
    }));

  if (rows.length === 0) throw new Error("No valid questions to add.");

  const admin = createAdminClient();
  const { data, error } = await admin.from("course_questions").insert(rows).select("*");
  if (error) throw new Error("Failed to add questions: " + error.message);

  return { course_code: course.code, added: data?.length ?? 0, questions: (data ?? []) as CourseQuestion[] };
}
