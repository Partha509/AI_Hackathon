"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Check,
  Loader2,
  Users,
  Building2,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { startNewSessionAction } from "@/app/actions/admin";
import { ALL_SEMESTERS_WITH_GRAD } from "@/lib/semester-utils";
import type { Profile } from "@/lib/supabase/types";

interface SessionSettingsManagerProps {
  currentSession: string;
  students: Profile[];
}

export function SessionSettingsManager({
  currentSession,
  students,
}: SessionSettingsManagerProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = React.useState(false);
  const [newSessionName, setNewSessionName] = React.useState("");
  const [confirmText, setConfirmText] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Group students by semester
  const semesterBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_SEMESTERS_WITH_GRAD.forEach((s) => (counts[s] = 0));

    students.forEach((s) => {
      const sem = s.current_semester || "3.2";
      counts[sem] = (counts[sem] || 0) + 1;
    });

    return counts;
  }, [students]);

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();

    if (!newSessionName.trim()) {
      toast.error("Please enter a valid session title.");
      return;
    }

    if (confirmText.trim().toUpperCase() !== "ADVANCE SEMESTER") {
      toast.error("Please type ADVANCE SEMESTER to confirm this action.");
      return;
    }

    setLoading(true);
    const res = await startNewSessionAction(newSessionName);
    setLoading(false);

    if (res.success) {
      toast.success(
        `Academic session updated to ${res.newSession}! Promoted ${res.promotedCount} students to their next semester.`
      );
      setOpenModal(false);
      setNewSessionName("");
      setConfirmText("");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to start new semester session");
    }
  }

  return (
    <div className="space-y-8">
      {/* Active Session Status Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary text-primary-foreground text-xs gap-1">
                <Calendar className="h-3 w-3" />
                Active Academic Session
              </Badge>
              <span className="text-xs text-muted-foreground">University Operations</span>
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-foreground">
              {currentSession}
            </h2>
            <p className="text-xs text-muted-foreground">
              All student course applications, prerequisite checks, and credit limits are synchronized with this active term.
            </p>
          </div>

          {/* Destructive Action Modal Trigger */}
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Start New Semester Session</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-2 text-destructive mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <DialogTitle>Start New Academic Session & Auto-Promote</DialogTitle>
                </div>
                <DialogDescription>
                  This administrative operation will establish a new university session and automatically advance <strong>every active undergraduate student</strong> to the subsequent semester:
                </DialogDescription>
              </DialogHeader>

              {/* Transition Mapping Preview */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 font-mono">
                <div className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Progression Matrix:</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                  <div>1.1 &rarr; 1.2</div>
                  <div>1.2 &rarr; 2.1</div>
                  <div>2.1 &rarr; 2.2</div>
                  <div>2.2 &rarr; 3.1</div>
                  <div>3.1 &rarr; 3.2</div>
                  <div>3.2 &rarr; 4.1</div>
                  <div>4.1 &rarr; 4.2</div>
                  <div>4.2 &rarr; Graduated</div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Affects all {students.length} currently enrolled students.
                </p>
              </div>

              <form onSubmit={handlePromote} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sessionTitle" className="text-xs font-semibold">
                    Next Academic Session Title
                  </Label>
                  <Input
                    id="sessionTitle"
                    placeholder="e.g. Fall 2025 / Spring 2026"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmation" className="text-xs font-semibold text-destructive">
                    Type <strong>ADVANCE SEMESTER</strong> to confirm
                  </Label>
                  <Input
                    id="confirmation"
                    placeholder="ADVANCE SEMESTER"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    required
                    className="h-9 font-mono"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    disabled={
                      loading ||
                      !newSessionName.trim() ||
                      confirmText.trim().toUpperCase() !== "ADVANCE SEMESTER"
                    }
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{loading ? "Promoting..." : "Confirm Auto-Promotion"}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Semester Distribution Breakdown */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              Undergraduate Student Distribution by Semester
            </h3>
            <span className="text-xs text-muted-foreground">
              Total Students: <strong>{students.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {ALL_SEMESTERS_WITH_GRAD.map((sem) => {
              const count = semesterBreakdown[sem] || 0;
              const isGraduated = sem === "Graduated";

              return (
                <div
                  key={sem}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    count > 0
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-border/60 bg-muted/20 opacity-60"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground block font-mono">
                    {isGraduated ? "Alumni" : `Sem ${sem}`}
                  </span>
                  <span
                    className={`font-heading text-xl font-extrabold block my-0.5 ${
                      count > 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {count === 1 ? "student" : "students"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
