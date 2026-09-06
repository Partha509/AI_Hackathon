import { AlertTriangle, ShieldCheck, UserCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GradeDisputesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Core Skill 3 (Tier 1)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
              Regrade Petition Advisory
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <AlertTriangle className="h-7 w-7 text-accent" />
            Student Grade Dispute Advisory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Objective AI second opinion re-evaluating student regrade petitions against marking rubrics, student answers, and examiner feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Load Dispute Req-101
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Audit Dispute
          </Button>
        </div>
      </div>

      {/* State-Driven Placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
          <UserCheck className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Pending Grade Petitions
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          View and arbitrate submitted student regrade requests with AI-generated delta suggestions and rubric-verified justification.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="sm" variant="outline">
            Review Sabbir Ahmed's Appeal
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Generate Advisory Opinion
          </Button>
        </div>
      </div>
    </div>
  );
}
