import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { advanceSession, getSettings } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
    }
    const data = await getSettings();
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

    const body = await request.json().catch(() => ({}));
    const { newSession } = body as { newSession?: string };
    // newSession is optional — advanceSession auto-computes the next name.
    const data = await advanceSession(typeof newSession === "string" ? newSession : undefined);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
