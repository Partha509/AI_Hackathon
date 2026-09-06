import { Scale, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GradingConsistencyPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Core Skill 2 (Tier 1)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-secondary/15 text-secondary font-semibold">
              Dual Examiner Variance
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Scale className="h-7 w-7 text-secondary" />
            Multi-Grader Consistency Checker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detect grading variance between Head Grader and Co-Examiner, analyze semantic feedback differences, and align with rubric marks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Load Sample Script (Sabbir Ahmed)
          </Button>
          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            Compare Graders
          </Button>
        </div>
      </div>

      {/* State-Driven Placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-4">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Multi-Grader Evaluation Workspace
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          Load an answer script evaluated by multiple examiners to identify score divergence and inspect rubric compliance.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="sm" variant="outline">
            Inspect Script-001 (LCS Recurrence)
          </Button>
          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            Compute Variance Delta
          </Button>
        </div>
      </div>
    </div>
  );
}
