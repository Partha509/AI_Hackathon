import Link from "next/link";
import {
  FileCheck,
  Scale,
  AlertTriangle,
  Bot,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Exam Question Quality & Repetition",
    description:
      "Audit exam questions against syllabus topics, Bloom's Taxonomy, and cross-reference previous semesters to catch semantic repetition.",
    href: "/exam-quality",
    icon: FileCheck,
    tier: "Tier 1 — Must Have",
    accent: "text-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    stats: "Bloom's + Syllabus Audit",
  },
  {
    title: "Multi-Grader Consistency Checker",
    description:
      "Compare dual-examiner score evaluations against marking rubrics. Instantly highlight variance anomalies and semantic reasoning gaps.",
    href: "/grading-consistency",
    icon: Scale,
    tier: "Tier 1 — Must Have",
    accent: "text-secondary",
    badgeBg: "bg-secondary/10 border-secondary/20",
    stats: "Dual Examiner Variance",
  },
  {
    title: "Student Grade Dispute Advisory",
    description:
      "Objective, unbiased second opinion evaluating student regrade appeals against official marking rubrics and model answers.",
    href: "/grade-disputes",
    icon: AlertTriangle,
    tier: "Tier 1 — Must Have",
    accent: "text-accent",
    badgeBg: "bg-accent/10 border-accent/20",
    stats: "Unbiased Re-Evaluation",
  },
  {
    title: "Unified Faculty Co-Pilot Chatbot",
    description:
      "Conversational front-door orchestrating all academic skills, querying live Supabase database records, and providing verifiable citations.",
    href: "/copilot-chat",
    icon: Bot,
    tier: "Central Front-Door",
    accent: "text-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    stats: "Live Tool Calling",
  },
];

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/70 py-16 sm:py-24 bg-gradient-to-b from-muted/40 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>AUST CSE Carnival 8.0 &bull; AI for Academic Life</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl">
              AI-Powered Academic Co-Pilot for{" "}
              <span className="text-primary underline decoration-accent/60 underline-offset-8">
                University Faculty
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              FacultyOS enhances university evaluation integrity with automated
              syllabus coverage analysis, dual-examiner variance detection, and
              unbiased student appeal assessments — keeping educators firmly in
              control.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="h-11 px-6 font-semibold">
                <Link href="/copilot-chat" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Launch Faculty Co-Pilot
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6">
                <Link href="/exam-quality" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Audit Exam Paper
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 text-xs text-muted-foreground border-t border-border/60 pt-8 w-full max-w-3xl">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero Blind Automation</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Bloom's Taxonomy Matched</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-600" />
                <span>Dual Examiner Auditing</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <span>AUST CSE Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Skill Grid */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Core Capabilities
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                The Four Pillars of FacultyOS
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Designed according to the hackathon battle plan — empowering
              academic decision-makers with verifiable evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.href}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${feature.badgeBg}`}
                      >
                        {feature.tier}
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-xs font-medium text-muted-foreground">
                      {feature.stats}
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="group-hover:translate-x-1 transition-transform p-0 h-auto font-semibold text-primary hover:bg-transparent"
                    >
                      <Link
                        href={feature.href}
                        className="flex items-center gap-1.5"
                      >
                        Launch
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advisory Banner */}
      <section className="border-t border-border/70 bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground block">
                  Academic Integrity Policy Notice
                </span>
                <span>
                  FacultyOS provides algorithmic decision-support. All grading
                  amendments and course curriculum decisions remain the sole
                  prerogative of appointed university faculty.
                </span>
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] bg-muted px-2.5 py-1 rounded border border-border">
              v0.1.0-alpha
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
