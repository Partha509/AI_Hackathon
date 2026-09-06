import { FileCheck, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamQualityPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Core Skill 1 (Tier 1)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
              Bloom's + Syllabus Audit
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileCheck className="h-7 w-7 text-primary" />
            Exam Question Quality & Repetition Checker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evaluate exam paper syllabus coverage, Bloom's cognitive taxonomy alignment, and cross-reference previous semesters' question banks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Load Fall 2024 Archive
          </Button>
          <Button size="sm">
            Upload Exam Paper
          </Button>
        </div>
      </div>

      {/* State-Driven Placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Ready to Audit Exam Questions
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          Select a course syllabus and question draft to begin automated Bloom's taxonomy verification, marks distribution analysis, and semantic repetition checks.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="sm" variant="outline">
            View Seed Data (CSE 321)
          </Button>
          <Button size="sm">
            Run Analysis Pass
          </Button>
        </div>
      </div>
    </div>
  );
}
