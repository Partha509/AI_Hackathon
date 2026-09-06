import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EndCourseResult,
  EvaluableCourse,
  EvaluationSummary,
  FacultyEvaluation,
} from "@/lib/supabase/types";

export type ActorContext = { userId?: string | null; role?: string | null; fullName?: string | null };

type CourseRow = {
  id: string;
  code: string;
  title: string;
  status: string | null;
  faculty_id: string | null;
  faculty_name: string | null;
};

async function resolveCourse(codeOrId: string): Promise<CourseRow | null> {
  const admin = createAdminClient();
  const value = codeOrId.trim();
  const byCode = await admin
    .from("courses")
    .select("id, code, title, status, faculty_id, faculty_name")
    .ilike("code", value)
    .maybeSingle();
  if (byCode.data) return byCode.data as CourseRow;
  const byId = await admin
    .from("courses")
    .select("id, code, title, status, faculty_id, faculty_name")
    .eq("id", value.toLowerCase().replace(/\s+/g, "-"))
    .maybeSingle();
  return (byId.data as CourseRow) ?? null;
}

function facultyOwns(course: CourseRow, ctx: ActorContext): boolean {
  if (course.faculty_id && ctx.userId && course.faculty_id === ctx.userId) return true;
  if (course.faculty_name && ctx.fullName && course.faculty_name === ctx.fullName) return true;
  return false;
}

/**
 * Authorizes a faculty/admin action on a course. Admin always allowed.
 * Faculty must own the course AND (unless allowInactive) the course must be active.
 */
function assertCanManage(course: CourseRow, ctx: ActorContext, opts?: { allowInactive?: boolean }) {
  if (ctx.role === "admin") return;
  if (ctx.role !== "faculty") throw new Error("Faculty or admin access required.");
  if (!facultyOwns(course, ctx)) {
    throw new Error(`You are not the assigned faculty for ${course.code}.`);
  }
  if (!opts?.allowInactive && course.status === "inactive") {
    throw new Error(`${course.code} is inactive — faculty access has been revoked for this course.`);
  }
}

async function approvedStudentIds(courseId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("course_applications")
    .select("student_id")
    .eq("course_id", courseId)
    .eq("status", "approved");
  return (data ?? []).map((r) => r.student_id as string);
}

/** Faculty/admin: submit or update final marks for enrolled students. */
export async function submitFinalMarks(input: {
  courseCode: string;
  marks: { student: string; marks: number; letter_grade?: string }[];
  ctx: ActorContext;
}): Promise<{ course_code: string; saved: number }> {
  const course = await resolveCourse(input.courseCode);
  if (!course) throw new Error(`No course found with code "${input.courseCode}".`);
  assertCanManage(course, input.ctx);

  const admin = createAdminClient();
  let saved = 0;
  for (const m of input.marks) {
    // Resolve the student (must be an approved enrollee).
    const term = `%${m.student.trim()}%`;
    const { data: matches } = await admin
      .from("profiles")
      .select("id, full_name, email, student_id")
      .eq("role", "student")
      .or(`full_name.ilike.${term},email.ilike.${term},student_id.ilike.${term}`)
      .limit(5);
    if (!matches || matches.length === 0) throw new Error(`No student found matching "${m.student}".`);
    if (matches.length > 1) {
      throw new Error(`Multiple students match "${m.student}" — be more specific (use email or ID).`);
    }
    const student = matches[0];

    const { error } = await admin.from("final_marks").upsert(
      {
        course_id: course.id,
        student_id: student.id,
        marks: m.marks,
        letter_grade: m.letter_grade ?? null,
        submitted_by: input.ctx.userId ?? null,
      },
      { onConflict: "course_id,student_id" }
    );
    if (error) throw new Error(`Failed to save marks for ${student.full_name}: ${error.message}`);
    saved += 1;
  }
  return { course_code: course.code, saved };
}

/** Faculty/admin: end (deactivate) a course after preconditions are met. */
export async function endCourse(input: {
  courseCode: string;
  ctx: ActorContext;
}): Promise<EndCourseResult> {
  const course = await resolveCourse(input.courseCode);
  if (!course) throw new Error(`No course found with code "${input.courseCode}".`);
  assertCanManage(course, input.ctx);
  if (course.status === "inactive") throw new Error(`${course.code} is already inactive.`);

  const admin = createAdminClient();

  // Precondition 1: final marks submitted for every approved-enrolled student.
  const studentIds = await approvedStudentIds(course.id);
  const { data: marks } = await admin
    .from("final_marks")
    .select("student_id")
    .eq("course_id", course.id);
  const markedIds = new Set((marks ?? []).map((m) => m.student_id as string));
  const missing = studentIds.filter((id) => !markedIds.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Cannot end ${course.code}: final marks are missing for ${missing.length} of ${studentIds.length} enrolled student(s).`
    );
  }

  // Precondition 2: all recheck/remarking requests for this course are resolved.
  const { data: exams } = await admin.from("exams").select("id").eq("course_id", course.id);
  const examIds = (exams ?? []).map((e) => e.id as string);
  if (examIds.length > 0) {
    const { data: scripts } = await admin.from("answer_scripts").select("id").in("exam_id", examIds);
    const scriptIds = (scripts ?? []).map((s) => s.id as string);
    if (scriptIds.length > 0) {
      const { data: openReqs } = await admin
        .from("grade_requests")
        .select("id")
        .in("script_id", scriptIds)
        .neq("status", "resolved");
      if ((openReqs ?? []).length > 0) {
        throw new Error(
          `Cannot end ${course.code}: ${openReqs!.length} recheck request(s) are still unresolved.`
        );
      }
    }
  }

  const { error } = await admin.from("courses").update({ status: "inactive" }).eq("id", course.id);
  if (error) throw new Error("Failed to end course: " + error.message);

  return {
    course_code: course.code,
    status: "inactive",
    students_marked: markedIds.size,
    total_students: studentIds.length,
  };
}

/** Faculty-facing: aggregate rating only (never individual rows). */
export async function getEvaluationSummary(input: {
  courseCode: string;
  ctx: ActorContext;
}): Promise<EvaluationSummary> {
  const course = await resolveCourse(input.courseCode);
  if (!course) throw new Error(`No course found with code "${input.courseCode}".`);
  // Faculty may only view summaries for their own courses; admin any.
  if (input.ctx.role === "faculty" && !facultyOwns(course, input.ctx)) {
    throw new Error(`You are not the assigned faculty for ${course.code}.`);
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("faculty_evaluations")
    .select("rating")
    .eq("course_id", course.id);
  const ratings = (data ?? []).map((r) => r.rating as number);
  const average =
    ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : null;
  return { course_code: course.code, count: ratings.length, average_rating: average };
}

/** Admin-only: raw individual evaluation records (rating + who submitted). */
export async function listEvaluations(input: {
  courseCode: string;
  ctx: ActorContext;
}): Promise<{ course_code: string; evaluations: (FacultyEvaluation & { student_name?: string })[] }> {
  if (input.ctx.role !== "admin") throw new Error("Only admins can view individual evaluations.");
  const course = await resolveCourse(input.courseCode);
  if (!course) throw new Error(`No course found with code "${input.courseCode}".`);

  const admin = createAdminClient();
  const { data } = await admin
    .from("faculty_evaluations")
    .select("*")
    .eq("course_id", course.id)
    .order("submitted_at", { ascending: false });
  const evals = (data ?? []) as FacultyEvaluation[];
  const ids = [...new Set(evals.map((e) => e.student_id))];
  const nameMap = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await admin.from("profiles").select("id, full_name").in("id", ids);
    for (const p of profs ?? []) nameMap.set(p.id as string, p.full_name as string);
  }
  return {
    course_code: course.code,
    evaluations: evals.map((e) => ({ ...e, student_name: nameMap.get(e.student_id) })),
  };
}

// ── Student-facing evaluation ─────────────────────────────────────────

/** Inactive courses a student was enrolled in, with whether they've evaluated. */
export async function getEvaluableCourses(studentId: string): Promise<EvaluableCourse[]> {
  const admin = createAdminClient();
  const { data: apps } = await admin
    .from("course_applications")
    .select("course_id")
    .eq("student_id", studentId)
    .eq("status", "approved");
  const courseIds = [...new Set((apps ?? []).map((a) => a.course_id as string))];
  if (courseIds.length === 0) return [];

  const { data: courses } = await admin
    .from("courses")
    .select("id, code, title, faculty_name, status")
    .in("id", courseIds)
    .eq("status", "inactive");
  const inactive = courses ?? [];

  const { data: evals } = await admin
    .from("faculty_evaluations")
    .select("course_id")
    .eq("student_id", studentId);
  const evaluated = new Set((evals ?? []).map((e) => e.course_id as string));

  return inactive.map((c) => ({
    course_id: c.id as string,
    code: c.code as string,
    title: c.title as string,
    faculty_name: (c.faculty_name as string) ?? null,
    already_evaluated: evaluated.has(c.id as string),
  }));
}

/** Student submits an anonymous evaluation for an inactive course they took (once). */
export async function submitEvaluation(input: {
  studentId: string;
  courseId: string;
  rating: number;
  comment?: string;
}): Promise<FacultyEvaluation> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be an integer from 1 to 5.");
  }
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, status, faculty_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found.");
  if (course.status !== "inactive") {
    throw new Error("Evaluations open only after the course has ended.");
  }

  const { data: enrolled } = await admin
    .from("course_applications")
    .select("id")
    .eq("course_id", input.courseId)
    .eq("student_id", input.studentId)
    .eq("status", "approved")
    .maybeSingle();
  if (!enrolled) throw new Error("You were not enrolled in this course.");

  const { data: existing } = await admin
    .from("faculty_evaluations")
    .select("id")
    .eq("course_id", input.courseId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  if (existing) throw new Error("You have already submitted an evaluation for this course.");

  const { data, error } = await admin
    .from("faculty_evaluations")
    .insert({
      course_id: input.courseId,
      faculty_id: (course.faculty_id as string) ?? null,
      student_id: input.studentId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw new Error("Failed to submit evaluation: " + error.message);
  return data as FacultyEvaluation;
}
