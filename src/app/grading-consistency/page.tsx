"use client";

import * as React from "react";
import {
  Scale,
  Users,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Quote,
  Sparkles,
  Gavel,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCRIPT_ID = "script-001";
const SCRIPT_LABEL = "Script #001: Sabbir Ahmed (21.01.04.099) — CSE 321 Final";

const STUDENT_ANSWER = `Let c[i,j] be the length of LCS of X[1..i] and Y[1..j].
Base: if i=0 or j=0, c[i,j] = 0.
If X[i] == Y[j], then c[i,j] = c[i-1,j-1] + 1.
Else, c[i,j] = max(c[i-1,j], c[i,j-1]).
Time complexity is O(m*n). I ran out of time before finishing the backtrack reconstruction routine, but the recurrence and table computation are complete.`;

const RUBRIC = [
  { criterion: "Recurrence definition", points: 5 },
  { criterion: "DP table computation logic", points: 5 },
  { criterion: "Reconstruction / backtracking algorithm", points: 5 },
];

interface GraderInfo {
  name: string;
  role: string;
  score: number;
  max: number;
  feedback: string;
}

interface ConsistencyResult {
  severity: "critical" | "moderate" | "low";
  graders: GraderInfo[];
  divergence: number;
  variancePct: number;
  diagnosis: string;
  recommendedScore: number;
  maxScore: number;
  justification: string;
  student: { name: string; id: string } | null;
}

export default function GradingConsistencyPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ConsistencyResult | null>(null);
  const [contextOpen, setContextOpen] = React.useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setResult(null);
    toast.loading("Analyzing grader discrepancy…", { id: "consistency" });

    try {
      const res = await fetch("/api/check-consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: SCRIPT_ID }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `API ${res.status}` }));
        throw new Error(error || `API ${res.status}`);
      }
      const data = (await res.json()) as ConsistencyResult;

      setResult(data);
      toast.success("Analysis complete — logged to database", {
        id: "consistency",
        description: `${data.variancePct}% variance · recommended ${data.recommendedScore}/${data.maxScore}`,
      });
    } catch (err) {
      toast.error("Analysis failed", {
        id: "consistency",
        description: err instanceof Error ? err.message : "Unexpected error. Please retry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const head = result?.graders?.[0];
  const co = result?.graders?.[result.graders.length - 1];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Core Skill 2 (Tier 1)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-secondary/15 text-secondary font-semibold">
              Dual Examiner Variance
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Scale className="h-7 w-7 text-secondary shrink-0" />
            Multi-Faculty Grading Consistency Checker
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Detect grading variance between the Head Examiner and Co-Examiner, analyze feedback
            divergence, and reconcile scores against the official rubric.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="script-select" className="text-xs font-medium text-muted-foreground">
              Answer Script
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="script-select"
                defaultValue={SCRIPT_ID}
                className="h-9 w-full sm:w-[26rem] appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={SCRIPT_ID}>{SCRIPT_LABEL}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Button
            className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Grader Discrepancy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grader comparison (only after analysis) */}
      {result && head && co && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-6">
          <GraderCard grader={head} tone="head" />
          <DivergenceBadge divergence={result.divergence} variancePct={result.variancePct} />
          <GraderCard grader={co} tone="co" />
        </div>
      )}

      {/* Student answer & rubric accordion */}
      <div className="rounded-xl border border-border bg-card mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setContextOpen((o) => !o)}
          aria-expanded={contextOpen}
          aria-controls="context-panel"
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-secondary" />
            Student Answer &amp; Rubric Context
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              contextOpen && "rotate-180"
            )}
          />
        </button>

        {contextOpen && (
          <div id="context-panel" className="grid grid-cols-1 lg:grid-cols-2 gap-5 border-t border-border px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Student Submission (LCS Question)
              </p>
              <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
                {STUDENT_ANSWER}
              </pre>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Official Rubric — 15 pts total
              </p>
              <ul className="space-y-2">
                {RUBRIC.map((r) => (
                  <li
                    key={r.criterion}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  >
                    <span className="text-foreground">{r.criterion}</span>
                    <span className="font-semibold text-secondary tabular-nums">{r.points} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* AI diagnosis */}
      <div aria-live="polite">
        {isLoading && <DiagnosisSkeleton />}
        {!isLoading && !result && <EmptyState />}
        {!isLoading && result && <DiagnosisPanel result={result} />}
      </div>
    </div>
  );
}

function GraderCard({ grader, tone }: { grader: GraderInfo; tone: "head" | "co" }) {
  const pct = grader.max ? Math.round((grader.score / grader.max) * 100) : 0;
  const accent = tone === "head" ? "text-secondary" : "text-destructive";
  const ring = tone === "head" ? "border-secondary/40" : "border-destructive/40";
  const bar = tone === "head" ? "bg-secondary" : "bg-destructive";

  return (
    <div className={cn("rounded-xl border-2 bg-card p-5 flex flex-col", ring)}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {grader.role}
          </p>
          <p className="font-heading text-base font-bold text-foreground">{grader.name}</p>
        </div>
        <Users className={cn("h-5 w-5 shrink-0", accent)} />
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className={cn("text-3xl font-bold tabular-nums", accent)}>
          {grader.score.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">/ {grader.max.toFixed(1)}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted mb-4">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-auto flex items-start gap-2 rounded-lg bg-muted/60 p-3">
        <Quote className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accent)} />
        <p className="text-xs italic leading-relaxed text-foreground">{grader.feedback}</p>
      </div>
    </div>
  );
}

function DivergenceBadge({ divergence, variancePct }: { divergence: number; variancePct: number }) {
  return (
    <div className="flex md:flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/50 bg-accent/5 px-4 py-3 md:w-32">
      <AlertTriangle className="h-6 w-6 text-accent" />
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums text-accent">{divergence.toFixed(1)}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          mark divergence
        </p>
        <p className="mt-1 text-xs font-bold text-accent">{variancePct}% variance</p>
      </div>
    </div>
  );
}

function DiagnosisPanel({ result }: { result: ConsistencyResult }) {
  const isCritical = result.severity === "critical";
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-xl border-2 p-5",
          isCritical ? "border-destructive/60 bg-destructive/5" : "border-accent/60 bg-accent/5"
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
              isCritical
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {isCritical ? "Critical Discrepancy Detected" : "Discrepancy Detected"}
          </span>
        </div>

        <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-destructive" />
          AI Discrepancy Diagnosis
        </h2>
        <p className="text-sm leading-relaxed text-foreground">{result.diagnosis}</p>
      </div>

      <div className="rounded-xl border border-secondary/40 bg-secondary/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Consensus Recommendation
              </p>
              <p className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums text-secondary">
                  {result.recommendedScore.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {result.maxScore.toFixed(1)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-start gap-2 rounded-lg bg-card border border-border p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            <p className="text-xs leading-relaxed text-foreground">
              <span className="font-semibold text-secondary">For the Examination Committee: </span>
              {result.justification}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-4">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground">
        Ready to Reconcile Grader Scores
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
        Run the discrepancy analysis to pull live examiner grades from the database and generate a
        rubric-aligned consensus recommendation.
      </p>
    </div>
  );
}

function DiagnosisSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading diagnosis">
      <span className="sr-only">Analyzing grader discrepancy…</span>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-6 w-56 rounded-full bg-muted animate-pulse mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-11/12 rounded bg-muted animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
