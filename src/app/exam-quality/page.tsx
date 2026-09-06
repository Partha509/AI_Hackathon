"use client";

import * as React from "react";
import {
  FileCheck,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  FileText,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COURSE_ID = "cse-321";
const COURSE_LABEL = "CSE 321 — Algorithms (Spring 2025 Final)";

const SAMPLE_DRAFT_QUESTIONS = [
  "Given an undirected connected graph G=(V,E) with positive edge weights, prove that if all edge weights are distinct, G has a unique Minimum Spanning Tree.",
  "Solve the 0/1 Knapsack problem using dynamic programming. Formulate the recurrence relation and analyze the time complexity.",
  "Define the classes P, NP, and NP-Complete. State the Cook-Levin theorem and explain its significance.",
];

interface CoverageResult {
  percentage: number;
  covered: string[];
  missing: string[];
}

interface RepetitionMatch {
  similarity: number;
  draftQuestion: string;
  historicalQuestion: string;
  historicalExam: string;
  explanation: string;
}

interface BloomBucket {
  level: string;
  count: number;
  percentage: number;
}

interface InspectionResult {
  coverage: CoverageResult;
  repetition: RepetitionMatch | null;
  blooms: BloomBucket[];
}

const BLOOM_STYLES: Record<string, string> = {
  Analyze: "bg-primary",
  Apply: "bg-secondary",
  Remember: "bg-accent",
};

export default function ExamQualityPage() {
  const [draft, setDraft] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<InspectionResult | null>(null);

  // Prefill questions handed off from the faculty question archive.
  React.useEffect(() => {
    const prefill = window.sessionStorage.getItem("facultyos:prefill-exam");
    if (prefill) {
      setDraft(prefill);
      window.sessionStorage.removeItem("facultyos:prefill-exam");
      toast.info("Questions loaded from your archive", {
        description: "Review and run the inspector when ready.",
      });
    }
  }, []);

  const questionLines = React.useMemo(
    () => draft.split("\n").map((l) => l.trim()).filter(Boolean),
    [draft]
  );

  const handleLoadSample = () => {
    setDraft(SAMPLE_DRAFT_QUESTIONS.join("\n"));
    setResult(null);
    toast.info("Sample draft loaded", {
      description: "3 questions populated. Question 1 intentionally mirrors the Fall 2024 final.",
    });
  };

  const handleInspect = async () => {
    if (questionLines.length === 0) {
      toast.warning("No questions to inspect", {
        description: "Add at least one question (one per line) or load the sample draft.",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    toast.loading("Inspecting assessment quality…", { id: "inspect" });

    try {
      const res = await fetch("/api/check-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: COURSE_ID, questions: questionLines }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `API ${res.status}` }));
        throw new Error(error || `API ${res.status}`);
      }
      const data = (await res.json()) as InspectionResult;

      setResult(data);
      toast.success("Inspection complete — logged to database", {
        id: "inspect",
        description: `${data.coverage.percentage}% syllabus coverage · ${
          data.repetition ? "Repetition risk detected" : "No repetition detected"
        }`,
      });
    } catch (err) {
      toast.error("Inspection failed", {
        id: "inspect",
        description: err instanceof Error ? err.message : "Unexpected error. Please retry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Core Skill 1 (Tier 1)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
              Bloom&apos;s + Syllabus Audit
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileCheck className="h-7 w-7 text-primary shrink-0" />
            Exam Question Quality &amp; Repetition Inspector
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Evaluate syllabus coverage, Bloom&apos;s cognitive taxonomy alignment, and cross-reference
            previous semesters&apos; question banks for repeated items.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="course-select" className="text-xs font-medium text-muted-foreground">
              Active Course
            </label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="course-select"
                defaultValue={COURSE_ID}
                className="h-9 w-full sm:w-80 appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={COURSE_ID}>{COURSE_LABEL}</option>
              </select>
            </div>
          </div>

          <Button
            variant="accent"
            className="sm:mt-auto gap-2"
            onClick={handleLoadSample}
            disabled={isLoading}
          >
            <ClipboardList className="h-4 w-4" />
            Load Sample Draft Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Input Area */}
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Draft Questions
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {questionLines.length} question{questionLines.length === 1 ? "" : "s"}
              </span>
            </div>
            <label htmlFor="draft-input" className="sr-only">
              Exam draft questions, one per line
            </label>
            <textarea
              id="draft-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isLoading}
              rows={16}
              spellCheck={false}
              placeholder={"Enter one question per line…\n\ne.g. Prove that a graph with distinct edge weights has a unique MST."}
              className="w-full resize-y rounded-lg border border-input bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <Button
              className="mt-4 w-full gap-2"
              onClick={handleInspect}
              disabled={isLoading || questionLines.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inspecting…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Inspect Assessment Quality
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Output Dashboard */}
        <section className="lg:col-span-3 space-y-6" aria-live="polite">
          {isLoading && <InspectionSkeleton />}
          {!isLoading && !result && <EmptyState />}
          {!isLoading && result && (
            <>
              <CoverageMeter coverage={result.coverage} />
              {result.repetition && <RepetitionAlert match={result.repetition} />}
              <BloomDistribution blooms={result.blooms} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground">
        Ready to Inspect Exam Questions
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
        Load the sample draft or paste your own questions, then run the inspector to see live
        syllabus coverage, repetition alerts, and Bloom&apos;s taxonomy distribution.
      </p>
    </div>
  );
}

function CoverageMeter({ coverage }: { coverage: CoverageResult }) {
  const { percentage, covered, missing } = coverage;
  const barTone =
    percentage >= 70 ? "bg-success" : percentage >= 40 ? "bg-accent" : "bg-destructive";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Topic Coverage Meter
        </h2>
        <span className="text-2xl font-bold tabular-nums text-foreground">{percentage}%</span>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Syllabus topic coverage"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700", barTone)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Covered ({covered.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {covered.length === 0 && (
              <span className="text-xs text-muted-foreground">None detected</span>
            )}
            {covered.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
              >
                <CheckCircle2 className="h-3 w-3" />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Missing ({missing.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.length === 0 && <span className="text-xs text-success">Full coverage</span>}
            {missing.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"
              >
                <XCircle className="h-3 w-3" />
                Missing: {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RepetitionAlert({ match }: { match: RepetitionMatch }) {
  return (
    <div className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-destructive">
              Repetition Risk Detected
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Matches {match.historicalExam} question bank
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-destructive px-3 py-1 text-sm font-bold text-destructive-foreground tabular-nums">
          {match.similarity}% similar
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1.5">
            Draft (Spring 2025)
          </p>
          <p className="text-xs leading-relaxed text-foreground">{match.draftQuestion}</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive mb-1.5">
            {match.historicalExam}
          </p>
          <p className="text-xs leading-relaxed text-foreground">{match.historicalQuestion}</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        <p className="text-xs leading-relaxed text-foreground">
          <span className="font-semibold text-destructive">AI Analysis: </span>
          {match.explanation}
        </p>
      </div>
    </div>
  );
}

function BloomDistribution({ blooms }: { blooms: BloomBucket[] }) {
  const maxCount = Math.max(1, ...blooms.map((b) => b.count));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <Brain className="h-4 w-4 text-primary" />
        Cognitive Diversity — Bloom&apos;s Tag Distribution
      </h2>

      <div className="space-y-3">
        {blooms.map((b) => (
          <div key={b.level}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{b.level}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {b.count} · {b.percentage}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  BLOOM_STYLES[b.level] ?? "bg-primary"
                )}
                style={{ width: `${(b.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectionSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Loading inspection results"
    >
      <span className="sr-only">Loading inspection results…</span>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          <div className="h-6 w-12 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-5 w-24 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-4 w-56 rounded bg-muted animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
