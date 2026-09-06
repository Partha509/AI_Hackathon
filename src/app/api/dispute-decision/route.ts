import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-client";

export async function POST(req: Request) {
  try {
    const { requestId, accepted, delta } = (await req.json()) as {
      requestId: string;
      accepted: boolean;
      delta?: number;
    };
    if (!requestId || typeof accepted !== "boolean") {
      return NextResponse.json(
        { error: "requestId and accepted (boolean) are required." },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    const decision = accepted
      ? `ACCEPTED — advisory applied (+${delta ?? 0} marks) pending Department Head review.`
      : "MAINTAINED — original grade upheld by Faculty.";

    const { data: updated, error } = await supabase
      .from("grade_requests")
      .update({ status: "resolved", faculty_decision: decision })
      .eq("id", requestId)
      .select("id, status, faculty_decision")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("chat_logs").insert({
      skill_used: "RegradeArbitrator",
      user_prompt: `Faculty decision recorded for ${requestId}`,
      ai_response: { requestId, accepted, delta: delta ?? 0, decision },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 }
    );
  }
}
