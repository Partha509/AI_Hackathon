import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { nextSemester, parseSemesterFromCode, type Semester } from "@/lib/semester";
import { nextSessionName } from "@/lib/session";
import type {
  AdminUserRow,
  AdvanceSessionResult,
  AppSettings,
  CreateUserInput,
  CreateUserResult,
} from "@/lib/supabase/types";

/** Base URL for building the invite redirect (set-password page). */
function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, role, department, student_id, current_semester, is_active, must_change_password, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load users: " + error.message);
  return (data ?? []) as AdminUserRow[];
}

export async function getSettings(): Promise<AppSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("app_settings").select("*").eq("id", 1).single();
  if (error) throw new Error("Failed to load settings: " + error.message);
  return data as AppSettings;
}

/**
 * Creates an admin-issued account via an invite link and inserts its profile.
 * The user sets their own password by following the returned link.
 */
export async function createInvitedUser(input: CreateUserInput): Promise<CreateUserResult> {
  const admin = createAdminClient();
  const redirectTo = `${appOrigin()}/auth/set-password`;

  const metadata: Record<string, unknown> = {
    full_name: input.full_name,
    role: input.role,
  };
  if (input.role === "student") {
    metadata.student_id = input.student_id;
    metadata.current_semester = input.current_semester;
  }

  // generateLink creates the auth user AND returns the invite action link
  // (works without SMTP; if SMTP is configured, inviteUserByEmail also emails it).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: { data: metadata, redirectTo },
  });
  if (error) throw new Error("Failed to create invite: " + error.message);

  const user = data.user;
  if (!user) throw new Error("Invite created but no user returned.");

  const { error: pErr } = await admin.from("profiles").upsert({
    id: user.id,
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    department: input.department ?? "CSE",
    student_id: input.role === "student" ? input.student_id ?? null : null,
    current_semester: input.role === "student" ? input.current_semester ?? null : null,
    must_change_password: true,
    is_active: true,
  });
  if (pErr) {
    // Roll back the auth user if the profile couldn't be written.
    await admin.auth.admin.deleteUser(user.id);
    throw new Error("Failed to create profile: " + pErr.message);
  }

  // Best-effort: also trigger Supabase's invite email when SMTP is configured.
  try {
    await admin.auth.admin.inviteUserByEmail(input.email, {
      data: metadata,
      redirectTo,
    });
  } catch {
    // Ignore — the account exists and the returned link still works.
  }

  return {
    id: user.id,
    email: input.email,
    invite_link: data.properties?.action_link ?? `${SUPABASE_URL}`,
  };
}

/**
 * Advances all active students one semester (4.2 → graduated/inactive) and
 * moves the academic session forward (Fall-25 → Spring-26 → …). An explicit
 * name can be supplied to override the computed next session.
 */
export async function advanceSession(override?: string): Promise<AdvanceSessionResult> {
  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("app_settings")
    .select("current_session")
    .eq("id", 1)
    .single();
  const current = settings?.current_session ?? "Fall-25";
  const newSession = override?.trim() || nextSessionName(current);

  const { data: students, error } = await admin
    .from("profiles")
    .select("id, current_semester")
    .eq("role", "student")
    .eq("is_active", true);
  if (error) throw new Error("Failed to load students: " + error.message);

  let advanced = 0;
  let graduated = 0;

  for (const s of students ?? []) {
    const current = s.current_semester as Semester | null;
    if (!current) continue;
    const next = nextSemester(current);
    if (next) {
      const { error: uErr } = await admin
        .from("profiles")
        .update({ current_semester: next })
        .eq("id", s.id);
      if (!uErr) advanced += 1;
    } else {
      // 4.2 → graduate (deactivate)
      const { error: uErr } = await admin
        .from("profiles")
        .update({ is_active: false })
        .eq("id", s.id);
      if (!uErr) graduated += 1;
    }
  }

  const { error: sErr } = await admin
    .from("app_settings")
    .update({ current_session: newSession, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (sErr) throw new Error("Failed to update session: " + sErr.message);

  return { new_session: newSession, advanced, graduated };
}

// ── Operations exposed to the AI chatbot ──────────────────────────────

/** Looks up profiles, optionally by role and/or a free-text query (name/email/student_id). */
export async function findUsers(input: {
  role?: "student" | "faculty" | "admin";
  query?: string;
  limit?: number;
}): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  let q = admin
    .from("profiles")
    .select(
      "id, email, full_name, role, department, student_id, current_semester, is_active, must_change_password, created_at"
    )
    .order("full_name", { ascending: true })
    .limit(input.limit ?? 25);
  if (input.role) q = q.eq("role", input.role);
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`;
    q = q.or(`full_name.ilike.${term},email.ilike.${term},student_id.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw new Error("Failed to find users: " + error.message);
  return (data ?? []) as AdminUserRow[];
}

/** Lists courses with the semester derived from each code. */
export async function listCoursesDetailed(): Promise<
  { id: string; code: string; title: string; faculty_name: string | null; semester: string | null }[]
> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .select("id, code, title, faculty_name")
    .order("code");
  if (error) throw new Error("Failed to list courses: " + error.message);
  return (data ?? []).map((c) => ({
    ...c,
    faculty_name: c.faculty_name ?? null,
    semester: parseSemesterFromCode(c.code),
  }));
}

/** Creates a course. The id is derived from the code (e.g. "CSE 3201" → "cse-3201"). */
export async function createCourse(input: {
  code: string;
  title: string;
  faculty_name?: string;
}): Promise<{ id: string; code: string; title: string; semester: string | null }> {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, " ");
  const id = code.toLowerCase().replace(/\s+/g, "-");
  const semester = parseSemesterFromCode(code);
  if (!semester) {
    throw new Error(
      `Course code "${code}" is invalid — it must encode a semester in its first two digits (e.g. CSE 3201 → 3.2).`
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("courses").select("id").eq("id", id).maybeSingle();
  if (existing) throw new Error(`A course with code ${code} already exists.`);

  const { error } = await admin.from("courses").insert({
    id,
    code,
    title: input.title.trim(),
    faculty_name: input.faculty_name?.trim() || null,
    learning_objectives: [],
  });
  if (error) throw new Error("Failed to create course: " + error.message);
  return { id, code, title: input.title.trim(), semester };
}

/** Enrolls a student into a course (course_applications). Resolves student by email/ID/name and course by code. */
export async function enrollStudent(input: {
  student: string;
  course_code: string;
  status?: "pending" | "approved" | "rejected";
}): Promise<{ student: string; course_code: string; status: string }> {
  const admin = createAdminClient();

  // Resolve the student profile.
  const matches = await findUsers({ role: "student", query: input.student, limit: 5 });
  if (matches.length === 0) throw new Error(`No student found matching "${input.student}".`);
  if (matches.length > 1) {
    throw new Error(
      `Multiple students match "${input.student}": ${matches
        .map((m) => `${m.full_name} <${m.email}>`)
        .join(", ")}. Please be more specific.`
    );
  }
  const student = matches[0];

  // Resolve the course by code.
  const code = input.course_code.trim().toUpperCase();
  const { data: course } = await admin
    .from("courses")
    .select("id, code")
    .ilike("code", code)
    .maybeSingle();
  if (!course) throw new Error(`No course found with code "${input.course_code}".`);

  const status = input.status ?? "approved";
  const { error } = await admin
    .from("course_applications")
    .upsert(
      { student_id: student.id, course_id: course.id, status },
      { onConflict: "student_id,course_id" }
    );
  if (error) throw new Error("Failed to enroll: " + error.message);

  return { student: `${student.full_name} <${student.email}>`, course_code: course.code, status };
}
