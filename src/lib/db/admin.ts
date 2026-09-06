import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { nextSemester, type Semester } from "@/lib/semester";
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
