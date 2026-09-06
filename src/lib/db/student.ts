import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseSemesterFromCode } from "@/lib/semester";
import type {
  ApplicationStatus,
  CatalogCourse,
  CourseApplication,
  GradeRequest,
  StudentGradedScript,
  StudentSummary,
} from "@/lib/supabase/types";

type ProfileLite = StudentSummary["profile"];

/** Overview counts for the student dashboard. */
export async function getStudentSummary(profile: ProfileLite): Promise<StudentSummary> {
  const supabase = await createClient();

  const countApplications = async (status: ApplicationStatus) => {
    const { count, error } = await supabase
      .from("course_applications")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id)
      .eq("status", status);
    // Tolerate the table not existing yet (pre-migration).
    if (error) return 0;
    return count ?? 0;
  };

  const [approved, pending, scriptsRes] = await Promise.all([
    countApplications("approved"),
    countApplications("pending"),
    supabase
      .from("answer_scripts")
      .select("id", { count: "exact", head: true })
      .eq("student_name", profile.full_name),
  ]);

  return {
    profile,
    approved_courses: approved,
    pending_applications: pending,
    graded_assessments: scriptsRes.count ?? 0,
  };
}

/** Graded answer scripts (with examiner grades + course context + appeal status) for a student. */
export async function getStudentGrades(fullName: string): Promise<StudentGradedScript[]> {
  const supabase = await createClient();

  const { data: scripts, error } = await supabase
    .from("answer_scripts")
    .select("*")
    .eq("student_name", fullName)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load answer scripts: " + error.message);

  const scriptList = scripts ?? [];
  if (scriptList.length === 0) return [];

  const scriptIds = scriptList.map((s) => s.id);
  const examIds = [...new Set(scriptList.map((s) => s.exam_id))];

  const [gradesRes, examsRes, appealsRes] = await Promise.all([
    supabase.from("grades").select("*").in("script_id", scriptIds),
    supabase.from("exams").select("id, course_id").in("id", examIds),
    supabase.from("grade_requests").select("script_id, status").in("script_id", scriptIds),
  ]);

  const grades = gradesRes.data ?? [];
  const exams = examsRes.data ?? [];
  const appeals = appealsRes.data ?? [];

  const courseIds = [...new Set(exams.map((e) => e.course_id))];
  const coursesRes = courseIds.length
    ? await supabase.from("courses").select("id, code, title").in("id", courseIds)
    : { data: [] };
  const courses = coursesRes.data ?? [];

  const examToCourse = new Map(exams.map((e) => [e.id, e.course_id]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const appealMap = new Map(appeals.map((a) => [a.script_id, a.status]));

  return scriptList.map((s) => {
    const courseId = examToCourse.get(s.exam_id);
    const course = courseId ? courseMap.get(courseId) : undefined;
    return {
      script_id: s.id,
      exam_id: s.exam_id,
      course_code: course?.code ?? "—",
      course_title: course?.title ?? "Unknown Course",
      question_number: s.question_number,
      question_text: s.question_text,
      rubric_guidelines: s.rubric_guidelines,
      grades: grades
        .filter((g) => g.script_id === s.id)
        .map((g) => ({
          grader_name: g.grader_name,
          grader_role: g.grader_role,
          score_awarded: Number(g.score_awarded),
          max_score: Number(g.max_score),
          feedback: g.feedback,
        })),
      appeal_status: (appealMap.get(s.id) as GradeRequest["status"]) ?? null,
    };
  });
}

/** Submits a regrade appeal for a script owned by the student (by name). */
export async function createAppeal(input: {
  scriptId: string;
  studentName: string;
  reason: string;
}): Promise<GradeRequest> {
  const supabase = await createClient();

  // The script must belong to this student.
  const { data: script } = await supabase
    .from("answer_scripts")
    .select("id, student_name")
    .eq("id", input.scriptId)
    .single();
  if (!script || script.student_name !== input.studentName) {
    throw new Error("Answer script not found for this student.");
  }

  // Only one open appeal per script.
  const { data: existing } = await supabase
    .from("grade_requests")
    .select("id")
    .eq("script_id", input.scriptId)
    .neq("status", "resolved")
    .maybeSingle();
  if (existing) throw new Error("An appeal is already in progress for this script.");

  const id = "req-" + crypto.randomUUID().slice(0, 8);
  const { data, error } = await supabase
    .from("grade_requests")
    .insert({
      id,
      script_id: input.scriptId,
      student_name: input.studentName,
      student_reason: input.reason,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error("Failed to submit appeal: " + error.message);
  return data as GradeRequest;
}

/** Course catalog with the student's application status per course. */
export async function getCourseCatalog(
  studentId: string,
  currentSemester: string | null
): Promise<CatalogCourse[]> {
  const supabase = await createClient();

  const [coursesRes, appsRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, code, title, faculty_name, learning_objectives")
      .order("code"),
    supabase.from("course_applications").select("course_id, status").eq("student_id", studentId),
  ]);
  if (coursesRes.error) throw new Error("Failed to load courses: " + coursesRes.error.message);

  const apps = appsRes.data ?? [];
  const appMap = new Map(apps.map((a) => [a.course_id, a.status as ApplicationStatus]));

  return (coursesRes.data ?? []).map((c) => {
    const semester = parseSemesterFromCode(c.code);
    return {
      id: c.id,
      code: c.code,
      title: c.title,
      faculty_name: c.faculty_name,
      objectives_count: Array.isArray(c.learning_objectives) ? c.learning_objectives.length : 0,
      semester,
      // Can apply only to courses in the student's current semester.
      can_apply: !!currentSemester && semester === currentSemester,
      application_status: appMap.get(c.id) ?? null,
    };
  });
}

/** Applies for a course (guards duplicates + enforces current-semester rule). */
export async function applyForCourse(input: {
  studentId: string;
  currentSemester: string | null;
  courseId: string;
}): Promise<CourseApplication> {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, code")
    .eq("id", input.courseId)
    .single();
  if (!course) throw new Error("Course not found.");

  const courseSemester = parseSemesterFromCode(course.code);
  if (!input.currentSemester || courseSemester !== input.currentSemester) {
    throw new Error("You can only apply to courses in your current semester.");
  }

  const { data: existing } = await supabase
    .from("course_applications")
    .select("*")
    .eq("student_id", input.studentId)
    .eq("course_id", input.courseId)
    .maybeSingle();
  if (existing) throw new Error("You have already applied for this course.");

  const { data, error } = await supabase
    .from("course_applications")
    .insert({ student_id: input.studentId, course_id: input.courseId, status: "pending" })
    .select("*")
    .single();
  if (error) throw new Error("Failed to submit application: " + error.message);
  return data as CourseApplication;
}
