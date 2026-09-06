"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EvaluableCourse } from "@/lib/supabase/types";

export function StudentEvaluations() {
  const [courses, setCourses] = React.useState<EvaluableCourse[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/evaluations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load.");
      setCourses(json.data as EvaluableCourse[]);
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
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold">Couldn&apos;t load evaluations</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-4">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <Star className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 font-semibold text-foreground">No courses to evaluate yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When a course you took is ended by its faculty, it appears here for an anonymous evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      <p className="text-sm text-muted-foreground">
        Your responses are <span className="font-medium text-foreground">anonymous</span> — faculty see
        only the average rating, never who submitted what.
      </p>
      {courses.map((c) => (
        <EvaluationCard key={c.course_id} course={c} onDone={load} />
      ))}
    </div>
  );
}

function EvaluationCard({ course, onDone }: { course: EvaluableCourse; onDone: () => void }) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (rating < 1) {
      toast.error("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.course_id, rating, comment: comment.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to submit.");
      toast.success("Thank you — your anonymous evaluation was submitted.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-base font-bold text-foreground">
            {course.code} — {course.title}
          </p>
          <p className="text-xs text-muted-foreground">{course.faculty_name ?? "Faculty"}</p>
        </div>
        {course.already_evaluated && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Submitted
          </span>
        )}
      </div>

      {!course.already_evaluated && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-1" role="group" aria-label="Rating out of 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    n <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Optional anonymous comment…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit evaluation
          </Button>
        </div>
      )}
    </Card>
  );
}
