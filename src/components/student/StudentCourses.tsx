"use client";

import * as React from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, CatalogCourse } from "@/lib/supabase/types";

export function StudentCourses() {
  const [courses, setCourses] = React.useState<CatalogCourse[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [applyingId, setApplyingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/courses", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load.");
      setCourses(json.data as CatalogCourse[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function apply(courseId: string) {
    setApplyingId(courseId);
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to apply.");
      toast.success("Application submitted. Awaiting Admin approval.");
      // Optimistically mark as pending.
      setCourses((prev) =>
        prev
          ? prev.map((c) => (c.id === courseId ? { ...c, application_status: "pending" } : c))
          : prev
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply.");
    } finally {
      setApplyingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold">Couldn&apos;t load the course catalog</p>
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
        <BookOpen className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 font-semibold text-foreground">No courses available yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Course offerings will appear here once published by the department.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-live="polite">
      {courses.map((c) => (
        <Card key={c.id} className="flex flex-col p-5">
          <div className="flex-1">
            <p className="font-heading text-base font-bold text-foreground">
              {c.code} — {c.title}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" /> {c.faculty_name ?? "Faculty TBD"}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> {c.objectives_count} learning objective
              {c.objectives_count === 1 ? "" : "s"}
            </p>
            {c.semester && (
              <span className="mt-2 inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Semester {c.semester}
              </span>
            )}
          </div>

          <div className="mt-4 border-t border-border/60 pt-4">
            {c.application_status ? (
              <StatusBadge status={c.application_status} />
            ) : c.can_apply ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => apply(c.id)}
                disabled={applyingId === c.id}
              >
                {applyingId === c.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Apply for Course
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Not in your current semester
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map = {
    pending: {
      label: "Pending Admin Approval",
      cls: "bg-accent/15 text-accent border-accent/30",
      icon: Loader2,
    },
    approved: {
      label: "Enrolled / Approved",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Application Declined",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
      icon: AlertTriangle,
    },
  } as const;
  const s = map[status];
  const Icon = s.icon;
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium",
        s.cls
      )}
    >
      <Icon className="h-4 w-4" />
      {s.label}
    </div>
  );
}
