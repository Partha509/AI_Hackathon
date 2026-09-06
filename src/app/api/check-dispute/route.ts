import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-client";

interface RubricCheck {
  criterion: string;
  met: boolean;
}

interface Advisory {
  verdict: string;
  confidence: number;
  adjustmentRange: string;
  targetScore: number;
  maxScore: number;
  rationale: string;
  rubricChecks: RubricCheck[];
  suggestedDelta: number;
}

function prettify(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// List all petitions (with examiner grades) for the petitions table.
export async function GET() {
  try {
    const supabase = createApiClient();
    const { data: requests } = await supabase
      .from("grade_requests")
      .select("id, script_id, student_name, student_reason, status, faculty_decision")
      .order("created_at", { ascending: true });

    const petitions = [];
    for (const r of requests ?? []) {
      const { data: script } = await supabase
        .from("answer_scripts")
        .select("student_id_number, question_number, exam_id")
        .eq("id", r.script_id)
        .maybeSingle();
      const { data: grades } = await supabase
        .from("grades")
        .select("grader_name, grader_role, score_awarded, max_score")
        .eq("script_id", r.script_id)
        .order("score_awarded", { ascending: false });

      petitions.push({
        id: r.id,
        student: r.student_name,
        studentId: script?.student_id_number ?? "",
        course: "CSE 321 — Algorithms",
        questionNumber: script?.question_number ?? 0,
        grievance: r.student_reason,
        status: r.status,
        facultyDecision: r.faculty_decision,
        maxScore: grades?.[0] ? Number(grades[0].max_score) : 15,
        originalScore: grades?.length ? Number(grades[grades.length - 1].score_awarded) : 0,
        examiners: (grades ?? []).map((g) => ({
          name: `${g.grader_name} (${g.grader_role})`,
          score: Number(g.score_awarded),
        })),
      });
    }

    return NextResponse.json({ petitions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { requestId } = (await req.json()) as { requestId: string };
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required." }, { status: 400 });
    }

    const supabase = createApiClient();

    const { data: request } = await supabase
      .from("grade_requests")
      .select("id, script_id, student_name, ai_recommendation")
      .eq("id", requestId)
      .maybeSingle();

    if (!request) {
      return NextResponse.json({ error: "Petition not found." }, { status: 404 });
    }

    const { data: grades } = await supabase
      .from("grades")
      .select("grader_name, grader_role, score_awarded, max_score")
      .eq("script_id", request.script_id)
      .order("score_awarded", { ascending: false });

    const maxScore = grades?.[0] ? Number(grades[0].max_score) : 15;
    const highest = grades?.length ? Math.max(...grades.map((g) => Number(g.score_awarded))) : 10;
    const lowest = grades?.length ? Math.min(...grades.map((g) => Number(g.score_awarded))) : 4;

    // Prefer the stored AI recommendation; otherwise derive from live grades.
    const stored = request.ai_recommendation as Record<string, unknown> | null;
    let advisory: Advisory;

    if (stored && stored.rubric_audit) {
      const audit = stored.rubric_audit as Record<
        string,
        { awarded: number; max: number; status: string }
      >;
      const target = Number(stored.suggested_score ?? highest);
      const delta = Number(stored.suggested_delta ?? target - lowest);
      advisory = {
        verdict: "Faculty Revisit Recommended",
        confidence: Math.round(Number(stored.confidence_score ?? 0.89) * 100),
        adjustmentRange: `+${Math.max(1, Math.floor(delta) - 1)} to +${Math.ceil(delta)} Marks`,
        targetScore: target,
        maxScore,
        suggestedDelta: Math.round(delta),
        rationale: String(stored.reasoning ?? ""),
        rubricChecks: Object.entries(audit).map(([k, v]) => ({
          criterion: `${prettify(k)} (${v.max} pts)`,
          met: v.status === "VERIFIED",
        })),
      };
    } else {
      const delta = highest - lowest;
      advisory = {
        verdict: "Faculty Revisit Recommended",
        confidence: 89,
        adjustmentRange: `+${Math.max(1, delta - 2)} to +${delta} Marks`,
        targetScore: highest,
        maxScore,
        suggestedDelta: Math.round(delta),
        rationale:
          "The submission satisfies the rubric criteria both examiners acknowledge as correct. The lower score disproportionately penalises verified work; a revisit toward the Head Examiner's assessment is warranted.",
        rubricChecks: [],
      };
    }

    // Persist: mark under review and store the advisory back on the petition.
    await supabase
      .from("grade_requests")
      .update({ status: "under_review", ai_recommendation: { ...(stored ?? {}), advisory } })
      .eq("id", requestId);

    await supabase.from("chat_logs").insert({
      skill_used: "RegradeArbitrator",
      user_prompt: `Re-evaluate regrade petition ${requestId} (${request.student_name})`,
      ai_response: advisory,
    });

    return NextResponse.json(advisory);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 }
    );
  }
}
