import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createAppeal, getStudentGrades } from "@/lib/db/student";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ ok: false, error: "Students only." }, { status: 403 });
    }
    const data = await getStudentGrades(profile.full_name);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ ok: false, error: "Students only." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { scriptId, reason } = body as { scriptId?: string; reason?: string };

    if (!scriptId || !reason?.trim()) {
      return NextResponse.json(
        { ok: false, error: "scriptId and reason are required." },
        { status: 400 }
      );
    }
    if (reason.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: "Please provide a reason of at least 10 characters." },
        { status: 400 }
      );
    }

    const data = await createAppeal({
      scriptId,
      studentName: profile.full_name,
      reason: reason.trim(),
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
