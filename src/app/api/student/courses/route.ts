import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { applyForCourse, getCourseCatalog } from "@/lib/db/student";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ ok: false, error: "Students only." }, { status: 403 });
    }
    const data = await getCourseCatalog(profile.id, profile.current_semester ?? null);
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
    const { courseId } = body as { courseId?: string };
    if (!courseId) {
      return NextResponse.json({ ok: false, error: "courseId is required." }, { status: 400 });
    }

    const data = await applyForCourse({
      studentId: profile.id,
      currentSemester: profile.current_semester ?? null,
      courseId,
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
