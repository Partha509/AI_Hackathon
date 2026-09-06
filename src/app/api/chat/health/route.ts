import { NextResponse } from "next/server";
import { chatComplete, GROQ_MODEL, isGroqConfigured } from "@/lib/ai/groq";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Verifies Groq + Supabase connectivity for the faculty chatbot. */
export async function GET() {
  const result: {
    groq: { configured: boolean; ok: boolean; model: string; error?: string };
    supabase: { ok: boolean; error?: string; sample?: Record<string, number> };
  } = {
    groq: { configured: isGroqConfigured(), ok: false, model: GROQ_MODEL },
    supabase: { ok: false },
  };

  // Supabase read check
  try {
    const db = createAdminClient();
    const [courses, profiles] = await Promise.all([
      db.from("courses").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    result.supabase.ok = !courses.error && !profiles.error;
    result.supabase.sample = {
      courses: courses.count ?? 0,
      profiles: profiles.count ?? 0,
    };
    if (courses.error) result.supabase.error = courses.error.message;
  } catch (err) {
    result.supabase.error = err instanceof Error ? err.message : "Supabase read failed.";
  }

  // Groq round-trip check (only if configured)
  if (result.groq.configured) {
    try {
      const reply = await chatComplete(
        [{ role: "user", content: "Reply with exactly: OK" }],
        { maxTokens: 100, temperature: 0 }
      );
      result.groq.ok = /ok/i.test(reply);
      if (!result.groq.ok) result.groq.error = `Unexpected reply: ${reply}`;
    } catch (err) {
      result.groq.error = err instanceof Error ? err.message : "Groq request failed.";
    }
  } else {
    result.groq.error = "GROQ_API_KEY not set.";
  }

  const ok = result.supabase.ok && result.groq.ok;
  return NextResponse.json({ ok, ...result }, { status: ok ? 200 : 503 });
}
