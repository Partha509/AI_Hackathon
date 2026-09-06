import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { getStudentSummary } from "@/lib/db/student";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }
    if (profile.role !== "student") {
      return NextResponse.json({ ok: false, error: "Students only." }, { status: 403 });
    }
    const data = await getStudentSummary({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      department: profile.department,
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
