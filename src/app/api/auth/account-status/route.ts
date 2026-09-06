import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Reports whether an email belongs to an account that hasn't completed
 * invite-based setup yet (Pending). Used to show a clear login message.
 * Only exposes the pending flag — no other account details.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) return NextResponse.json({ pending: false });

    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("must_change_password")
      .eq("email", email)
      .maybeSingle();

    return NextResponse.json({ pending: !!data?.must_change_password });
  } catch {
    return NextResponse.json({ pending: false });
  }
}
