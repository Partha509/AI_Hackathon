import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { getEvaluableCourses, submitEvaluation } from "@/lib/db/lifecycle";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ ok: false, error: "Students only." }, { status: 403 });
    }
    const data = await getEvaluableCourses(profile.id);
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
    const { courseId, rating, comment } = body as {
      courseId?: string;
      rating?: number;
      comment?: string;
    };
    if (!courseId || typeof rating !== "number") {
      return NextResponse.json(
        { ok: false, error: "courseId and a numeric rating are required." },
        { status: 400 }
      );
    }

    const data = await submitEvaluation({
      studentId: profile.id,
      courseId,
      rating,
      comment: typeof comment === "string" ? comment : undefined,
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
