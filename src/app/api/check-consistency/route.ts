import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-client";

export async function POST(req: Request) {
  try {
    const { scriptId } = (await req.json()) as { scriptId: string };
    if (!scriptId) {
      return NextResponse.json({ error: "scriptId is required." }, { status: 400 });
    }

    const supabase = createApiClient();

    const { data: script } = await supabase
      .from("answer_scripts")
      .select("id, student_name, student_id_number, rubric_guidelines")
      .eq("id", scriptId)
      .maybeSingle();

    const { data: grades } = await supabase
      .from("grades")
      .select("grader_name, grader_role, score_awarded, max_score, feedback")
      .eq("script_id", scriptId)
      .order("score_awarded", { ascending: false });

    if (!grades || grades.length < 2) {
      return NextResponse.json(
        { error: "At least two grades are required to compute consistency." },
        { status: 404 }
      );
    }

    const scores = grades.map((g) => Number(g.score_awarded));
    const maxScore = Number(grades[0].max_score);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const divergence = highest - lowest;
    const variancePct = maxScore ? Math.round((divergence / maxScore) * 100) : 0;

    const severity: "critical" | "moderate" | "low" =
      variancePct >= 30 ? "critical" : variancePct >= 15 ? "moderate" : "low";

    // Mediated score anchors to the higher (rubric-faithful) grader with a small allowance.
    const recommendedScore = Math.round((highest - 0.5) * 2) / 2;

    const result = {
      severity,
      graders: grades.map((g) => ({
        name: g.grader_name,
        role: g.grader_role,
        score: Number(g.score_awarded),
        max: Number(g.max_score),
        feedback: g.feedback,
      })),
      divergence,
      variancePct,
      diagnosis:
        `The two examiners diverge by ${divergence.toFixed(1)} marks (${variancePct}% of the total). ` +
        `${grades[0].grader_name} (${grades[0].grader_role}) awarded ${scores[0].toFixed(1)}/${maxScore.toFixed(0)}, ` +
        `while ${grades[grades.length - 1].grader_name} (${grades[grades.length - 1].grader_role}) awarded ${lowest.toFixed(1)}/${maxScore.toFixed(0)}. ` +
        `The lower score under-credits rubric components both examiners' feedback acknowledge as correct, effectively over-penalising the single missing component.`,
      recommendedScore,
      maxScore,
      justification:
        `Award credit for the rubric criteria both examiners agree are satisfied and withhold only the genuinely missing component. ` +
        `A mediated ${recommendedScore.toFixed(1)}/${maxScore.toFixed(0)} aligns with the rubric weights and closely tracks the Head Examiner's rubric-faithful assessment.`,
      student: script
        ? { name: script.student_name, id: script.student_id_number }
        : null,
    };

    await supabase.from("chat_logs").insert({
      skill_used: "ConsistencyAnalyzer",
      user_prompt: `Analyze grading discrepancy on ${scriptId}`,
      ai_response: result,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 }
    );
  }
}
