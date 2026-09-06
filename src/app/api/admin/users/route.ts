import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createInvitedUser, listUsers } from "@/lib/db/admin";
import { isSemester } from "@/lib/semester";
import type { CreateUserInput } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
    }
    const data = await listUsers();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<CreateUserInput>;
    const { email, full_name, role, department, student_id, current_semester } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { ok: false, error: "email, full_name and role are required." },
        { status: 400 }
      );
    }
    if (role !== "student" && role !== "faculty") {
      return NextResponse.json(
        { ok: false, error: "role must be 'student' or 'faculty'." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }
    if (role === "student") {
      if (!student_id?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Students require a student ID." },
          { status: 400 }
        );
      }
      if (!current_semester || !isSemester(current_semester)) {
        return NextResponse.json(
          { ok: false, error: "A valid current semester (e.g. 3.2) is required." },
          { status: 400 }
        );
      }
    }

    const data = await createInvitedUser({
      email: email.trim(),
      full_name: full_name.trim(),
      role,
      department: department?.trim() || "CSE",
      student_id: role === "student" ? student_id!.trim() : undefined,
      current_semester: role === "student" ? current_semester : undefined,
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    const status = /already|exists|registered|duplicate/i.test(message) ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
