"use client";

import * as React from "react";
import {
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  Loader2,
  Sparkles,
  ArrowLeft,
  Quote,
  CheckCircle2,
  XCircle,
  Gavel,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PetitionStatus = "pending" | "under_review" | "resolved";

interface Petition {
  id: string;
  student: string;
  studentId: string;
  course: string;
  questionNumber: number;
  grievance: string;
  originalScore: number;
  maxScore: number;
  examiners: { name: string; score: number }[];
  status: PetitionStatus;
  facultyDecision?: string | null;
}

interface RubricCheck {
  criterion: string;
  met: boolean;
}

interface DisputeAdvisory {
  verdict: string;
  confidence: number;
  adjustmentRange: string;
  targetScore: number;
  maxScore: number;
  rationale: string;
  rubricChecks: RubricCheck[];
  suggestedDelta: number;
}

const STATUS_STYLES: Record<PetitionStatus, string> = {
  pending: "border-accent/40 bg-accent/10 text-accent",
  under_review: "border-secondary/40 bg-secondary/10 text-secondary",
  resolved: "border-success/40 bg-success/10 text-success",
};

const STATUS_LABEL: Record<PetitionStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
};

export default function GradeDisputesPage() {
  const [petitions, setPetitions] = React.useState<Petition[]>([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [advisory, setAdvisory] = React.useState<DisputeAdvisory | null>(null);

  const active = petitions.find((p) => p.id === activeId) ?? null;

  const loadPetitions = React.useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/check-dispute");
      if (!res.ok) throw new Error(`API ${res.status}`);
      const { petitions } = (await res.json()) as { petitions: Petition[] };
      setPetitions(petitions);
    } catch (err) {
      toast.error("Failed to load petitions", {
        description: err instanceof Error ? err.message : "Unexpected error.",
      });
    } finally {
      setListLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPetitions();
  }, [loadPetitions]);

  const openPetition = (id: string) => {
    setActiveId(id);
    setAdvisory(null);
  };

  const closePetition = () => {
    setActiveId(null);
    setAdvisory(null);
  };

  const handleReevaluate = async () => {
    if (!active) return;
    setIsLoading(true);
    setAdvisory(null);
    toast.loading("Running AI rubric re-evaluation…", { id: "dispute" });

    try {
      const res = await fetch("/api/check-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: active.id }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `API ${res.status}` }));
        throw new Error(error || `API ${res.status}`);
      }
      const data = (await res.json()) as DisputeAdvisory;

      setAdvisory(data);
      setPetitions((prev) =>
        prev.map((p) => (p.id === active.id ? { ...p, status: "under_review" } : p))
      );
      toast.success("Advisory generated — saved to database", {
        id: "dispute",
        description: `${data.verdict} · ${data.confidence}% confidence`,
      });
    } catch (err) {
      toast.error("Re-evaluation failed", {
        id: "dispute",
        description: err instanceof Error ? err.message : "Unexpected error. Please retry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recordDecision = async (accepted: boolean) => {
    if (!active) return;
    const delta = advisory?.suggestedDelta ?? 0;
    toast.loading("Recording decision…", { id: "decision" });
    try {
      const res = await fetch("/api/dispute-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: active.id, accepted, delta }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `API ${res.status}` }));
        throw new Error(error || `API ${res.status}`);
      }
      setPetitions((prev) =>
        prev.map((p) => (p.id === active.id ? { ...p, status: "resolved" } : p))
      );
      toast.success("Decision recorded for Department Head review", {
        id: "decision",
        description: accepted
          ? `Advisory accepted (+${delta} marks) for ${active.student}.`
          : `Original grade maintained for ${active.student}.`,
      });
      closePetition();
    } catch (err) {
      toast.error("Failed to record decision", {
        id: "decision",
        description: err instanceof Error ? err.message : "Unexpected error.",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border/80 pb-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Core Skill 3 (Tier 1)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
            Regrade Petition Advisory
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <AlertTriangle className="h-7 w-7 text-accent shrink-0" />
          Student Grade Dispute &amp; Regrade Advisory
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Objective AI second opinion re-evaluating student regrade petitions against marking
          rubrics, student answers, and examiner feedback.
        </p>
      </div>

      {!active ? (
        <PetitionList petitions={petitions} loading={listLoading} onReview={openPetition} />
      ) : (
        <PetitionDetail
          petition={active}
          advisory={advisory}
          isLoading={isLoading}
          onBack={closePetition}
          onReevaluate={handleReevaluate}
          onDecision={recordDecision}
        />
      )}
    </div>
  );
}

function PetitionList({
  petitions,
  loading,
  onReview,
}: {
  petitions: Petition[];
  loading: boolean;
  onReview: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          Pending Petitions
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {loading ? "loading…" : `${petitions.length} total`}
        </span>
      </div>

      <div className="hidden md:grid grid-cols-[1fr_1.5fr_1.5fr_auto_auto_auto] gap-4 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
        <span>Petition</span>
        <span>Student</span>
        <span>Course</span>
        <span>Q#</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      {loading ? (
        <div className="p-5 space-y-3" role="status" aria-busy="true">
          <span className="sr-only">Loading petitions…</span>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : petitions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <UserCheck className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">No pending petitions found in the database.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {petitions.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.5fr_auto_auto_auto] gap-2 md:gap-4 px-5 py-4 md:items-center"
            >
              <span className="font-mono text-xs font-semibold text-foreground">{p.id}</span>
              <span className="text-sm text-foreground">
                {p.student}
                <span className="block text-[11px] text-muted-foreground">{p.studentId}</span>
              </span>
              <span className="text-sm text-muted-foreground">{p.course}</span>
              <span className="text-sm text-foreground md:text-center">Q{p.questionNumber}</span>
              <span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_STYLES[p.status]
                  )}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </span>
              <span className="md:text-right">
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => onReview(p.id)}
                  disabled={p.status === "resolved"}
                >
                  {p.status === "resolved" ? "Resolved" : "Review Petition"}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PetitionDetail({
  petition,
  advisory,
  isLoading,
  onBack,
  onReevaluate,
  onDecision,
}: {
  petition: Petition;
  advisory: DisputeAdvisory | null;
  isLoading: boolean;
  onBack: () => void;
  onReevaluate: () => void;
  onDecision: (accepted: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to petitions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              Student Grievance — {petition.student} ({petition.studentId})
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">{petition.id}</span>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-4">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-sm italic leading-relaxed text-foreground">{petition.grievance}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-accent" />
            Original Examiner Scores
          </h2>
          <ul className="space-y-2">
            {petition.examiners.map((e) => (
              <li
                key={e.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="text-xs text-foreground">{e.name}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {e.score.toFixed(1)}
                  <span className="text-xs font-normal text-muted-foreground">
                    /{petition.maxScore.toFixed(0)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Button
            className="mt-4 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={onReevaluate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Re-evaluating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run AI Rubric Re-evaluation
              </>
            )}
          </Button>
        </div>
      </div>

      <div aria-live="polite">
        {isLoading && <AdvisorySkeleton />}
        {!isLoading && advisory && <AdvisoryCard advisory={advisory} onDecision={onDecision} />}
      </div>
    </div>
  );
}

function AdvisoryCard({
  advisory,
  onDecision,
}: {
  advisory: DisputeAdvisory;
  onDecision: (accepted: boolean) => void;
}) {
  return (
    <div className="rounded-xl border-2 border-accent/50 bg-accent/5 p-5 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {advisory.verdict}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          Confidence: <span className="text-accent">{advisory.confidence}%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recommended Adjustment
          </p>
          <p className="text-2xl font-bold text-accent">{advisory.adjustmentRange}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Target:{" "}
            <span className="font-semibold text-foreground">
              {advisory.targetScore.toFixed(0)}/{advisory.maxScore.toFixed(0)}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Rubric Checkpoints
          </p>
          <ul className="space-y-1.5">
            {advisory.rubricChecks.map((c) => (
              <li key={c.criterion} className="flex items-center gap-2 text-xs">
                {c.met ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                )}
                <span className={cn(c.met ? "text-foreground" : "text-muted-foreground")}>
                  {c.criterion}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-card border border-border p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-semibold text-accent">Rationale: </span>
          {advisory.rationale}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Gavel className="h-3.5 w-3.5" />
          Final decision rests with Faculty:
        </span>
        <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            className="gap-2 bg-success text-success-foreground hover:bg-success/90"
            onClick={() => onDecision(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept Advisory (+{advisory.suggestedDelta} Marks)
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => onDecision(false)}>
            <XCircle className="h-4 w-4" />
            Maintain Original Grade
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdvisorySkeleton() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Generating advisory"
    >
      <span className="sr-only">Running AI rubric re-evaluation…</span>
      <div className="h-6 w-64 rounded-full bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-11/12 rounded bg-muted animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
