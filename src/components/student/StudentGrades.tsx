"use client";

import * as React from "react";
import { AlertTriangle, FileText, Loader2, RefreshCw, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GradeRequest, StudentGradedScript } from "@/lib/supabase/types";

export function StudentGrades() {
  const [scripts, setScripts] = React.useState<StudentGradedScript[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [appealTarget, setAppealTarget] = React.useState<StudentGradedScript | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/grades", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load.");
      setScripts(json.data as StudentGradedScript[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold">Couldn&apos;t load your marks</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-4">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!scripts || scripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 font-semibold text-foreground">No graded answer scripts found yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Once your exam answers are graded, they&apos;ll appear here with examiner feedback and an option to appeal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      {scripts.map((s) => (
        <ScriptCard key={s.script_id} script={s} onAppeal={() => setAppealTarget(s)} />
      ))}

      <RegradeDialog
        script={appealTarget}
        onClose={() => setAppealTarget(null)}
        onSuccess={load}
      />
    </div>
  );
}

function ScriptCard({
  script,
  onAppeal,
}: {
  script: StudentGradedScript;
  onAppeal: () => void;
}) {
  const hasAppeal = script.appeal_status !== null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-base font-bold text-foreground">
            {script.course_code} — {script.course_title}
          </p>
          <p className="text-sm text-muted-foreground">Question {script.question_number}</p>
        </div>
        {hasAppeal ? (
          <AppealBadge status={script.appeal_status!} />
        ) : (
          <Button variant="outline" size="sm" onClick={onAppeal}>
            <ScrollText className="h-4 w-4" /> Request Regrade
          </Button>
        )}
      </div>

      <p className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-foreground">
        {script.question_text}
      </p>

      <div className="mt-4 space-y-3">
        {script.grades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Awaiting examiner marks.</p>
        ) : (
          script.grades.map((g, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {g.grader_name}
                  {g.grader_role ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({g.grader_role})
                    </span>
                  ) : null}
                </span>
                <span className="font-heading text-sm font-bold text-primary">
                  {g.score_awarded.toFixed(1)} / {g.max_score.toFixed(1)}
                </span>
              </div>
              {g.feedback && (
                <p className="mt-1.5 text-sm text-muted-foreground">{g.feedback}</p>
              )}
            </div>
          ))
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
          View rubric
        </summary>
        <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
          {script.rubric_guidelines}
        </p>
      </details>
    </Card>
  );
}

function AppealBadge({ status }: { status: GradeRequest["status"] }) {
  const map = {
    pending: { label: "Appeal Pending", cls: "bg-accent/15 text-accent border-accent/30" },
    under_review: { label: "Under Review", cls: "bg-secondary/15 text-secondary border-secondary/30" },
    resolved: {
      label: "Appeal Resolved",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
  } as const;
  const s = map[status];
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", s.cls)}>
      {s.label}
    </span>
  );
}

function RegradeDialog({
  script,
  onClose,
  onSuccess,
}: {
  script: StudentGradedScript | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (script) setReason("");
  }, [script]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!script) return;
    if (reason.trim().length < 10) {
      toast.error("Please provide a reason of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: script.script_id, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to submit.");
      toast.success("Regrade request submitted. Awaiting faculty review.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={!!script}
      onClose={onClose}
      title="Request a regrade"
      description={script ? `${script.course_code} · Question ${script.question_number}` : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="appeal-reason">Why should this answer be re-evaluated?</Label>
          <textarea
            id="appeal-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain, referencing the rubric, why you believe the mark should change…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit appeal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
