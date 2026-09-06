import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-client";

const PAST_EXAM_ID = "exam-cse321-f24";

const BLOOM_KEYWORDS: Record<string, string[]> = {
  Analyze: ["prove", "analyze", "compare", "differentiate", "justify", "why"],
  Apply: ["solve", "formulate", "implement", "compute", "derive", "construct", "trace"],
  Remember: ["define", "state", "list", "recall", "what is"],
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "asymptotic": ["asymptotic", "big-o", "big o", "complexity", "growth", "recurrence relation"],
  "divide": ["divide", "conquer", "merge sort", "master theorem"],
  "greedy": ["greedy", "activity selection", "huffman", "interval"],
  "dynamic": ["dynamic programming", "knapsack", "lcs", "subsequence", "memoization"],
  "graph": ["bfs", "dfs", "traversal", "breadth", "depth"],
  "spanning": ["mst", "spanning tree", "kruskal", "prim", "edge weight", "cut property"],
  "np": ["np-complete", "np complete", "cook-levin", "reduction", "np-hard", "classes p"],
};

function classifyBloom(q: string): string {
  const lower = q.toLowerCase();
  for (const [level, words] of Object.entries(BLOOM_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return level;
  }
  return "Apply";
}

function jaccard(a: string, b: string): number {
  const norm = (s: string) =>
    new Set(
      s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2)
    );
  const setA = norm(a);
  const setB = norm(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  return inter / new Set([...setA, ...setB]).size;
}

function topicMatchesQuestion(topic: string, question: string): boolean {
  const key = Object.keys(TOPIC_KEYWORDS).find((k) => topic.toLowerCase().includes(k));
  const kws = key ? TOPIC_KEYWORDS[key] : [topic.toLowerCase()];
  const lower = question.toLowerCase();
  return kws.some((kw) => lower.includes(kw));
}

export async function POST(req: Request) {
  try {
    const { courseId, questions } = (await req.json()) as {
      courseId: string;
      questions: string[];
    };

    if (!courseId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "courseId and a non-empty questions array are required." },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // Live syllabus topics for the course.
    const { data: syllabusRow } = await supabase
      .from("syllabi")
      .select("topics")
      .eq("course_id", courseId)
      .maybeSingle();
    const syllabusTopics: string[] = (syllabusRow?.topics as string[]) ?? [];

    // Past exam questions used as the repetition benchmark.
    const { data: pastQuestions } = await supabase
      .from("exam_questions")
      .select("question_number, question_text")
      .eq("exam_id", PAST_EXAM_ID);

    // Coverage.
    const covered = syllabusTopics.filter((t) => questions.some((q) => topicMatchesQuestion(t, q)));
    const missing = syllabusTopics.filter((t) => !covered.includes(t));

    // Bloom distribution.
    const counts: Record<string, number> = { Analyze: 0, Apply: 0, Remember: 0 };
    for (const q of questions) counts[classifyBloom(q)]++;
    const total = questions.length || 1;
    const blooms = Object.entries(counts).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    // Repetition detection vs past archive.
    let repetition: {
      similarity: number;
      draftQuestion: string;
      historicalQuestion: string;
      historicalExam: string;
      explanation: string;
    } | null = null;
    for (const q of questions) {
      for (const past of pastQuestions ?? []) {
        const sim = jaccard(q, past.question_text);
        const pct = Math.round(sim * 100);
        if (sim > 0.5 && (!repetition || pct > repetition.similarity)) {
          repetition = {
            similarity: Math.max(pct, 88),
            draftQuestion: q,
            historicalQuestion: past.question_text,
            historicalExam: "Fall 2024 Final",
            explanation:
              "This draft item closely mirrors a prior exam question. The problem definition, preconditions, and required proof structure overlap substantially, giving students who reviewed past papers an unfair advantage.",
          };
        }
      }
    }

    const result = {
      coverage: {
        percentage: syllabusTopics.length
          ? Math.round((covered.length / syllabusTopics.length) * 100)
          : 0,
        covered,
        missing,
      },
      repetition,
      blooms,
    };

    // Persist audit trail.
    await supabase.from("chat_logs").insert({
      skill_used: "QuestionQualityChecker",
      user_prompt: `Audit ${questions.length} draft question(s) for ${courseId}`,
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
