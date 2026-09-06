"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileQuestion,
  Sparkles,
  Archive,
  Filter,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  isCourseForFaculty,
  currentSemester,
  semesterRank,
  type Course,
  type Exam,
  type ExamQuestion,
  type Profile,
} from "@/lib/faculty-data";
import { Button } from "@/components/ui/button";
import { AddQuestionsDialog } from "@/components/faculty/AddQuestionsDialog";
import { cn } from "@/lib/utils";

interface QuestionRow extends ExamQuestion {
  courseCode: string;
  courseId: string;
  semester: string;
}

const BLOOM_TONE: Record<string, string> = {
  Remember: "bg-accent/15 text-accent border-accent/30",
  Understand: "bg-accent/15 text-accent border-accent/30",
  Apply: "bg-secondary/15 text-secondary border-secondary/30",
  Analyze: "bg-primary/15 text-primary border-primary/30",
  Evaluate: "bg-primary/15 text-primary border-primary/30",
  Create: "bg-primary/15 text-primary border-primary/30",
};

export default function FacultyQuestionsPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"current" | "past">("current");
  const [current, setCurrent] = React.useState<QuestionRow[]>([]);
  const [past, setPast] = React.useState<QuestionRow[]>([]);
  const [myCourses, setMyCourses] = React.useState<{ id: string; code: string; title: string }[]>([]);
  const [activeSemester, setActiveSemester] = React.useState("Spring 2025");

  // Past-archive filters.
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [topicFilter, setTopicFilter] = React.useState("all");

  const load = React.useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be signed in as faculty to view this page.");
          return;
        }
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const [{ data: courses }, { data: exams }, { data: questions }] = await Promise.all([
          supabase.from("courses").select("*"),
          supabase.from("exams").select("*"),
          supabase.from("exam_questions").select("*"),
        ]);

        const mine = ((courses as Course[]) ?? []).filter((c) =>
          isCourseForFaculty(c, prof as Profile)
        );
        setMyCourses(mine.map((c) => ({ id: c.id, code: c.code, title: c.title })));
        const myCourseIds = new Set(mine.map((c) => c.id));
        const codeById = new Map(mine.map((c) => [c.id, c.code]));

        const myExams = ((exams as Exam[]) ?? []).filter((e) => myCourseIds.has(e.course_id));
        const examById = new Map(myExams.map((e) => [e.id, e]));
        const sem = currentSemester(myExams);
        setActiveSemester(sem);

        const rows: QuestionRow[] = ((questions as ExamQuestion[]) ?? [])
          .filter((q) => examById.has(q.exam_id))
          .map((q) => {
            const exam = examById.get(q.exam_id)!;
            return {
              ...q,
              courseId: exam.course_id,
              courseCode: codeById.get(exam.course_id) ?? exam.course_id,
              semester: exam.semester,
            };
          });

        setCurrent(rows.filter((r) => r.semester === sem).sort((a, b) => a.question_number - b.question_number));
        setPast(
          rows
            .filter((r) => r.semester !== sem && semesterRank(r.semester) < semesterRank(sem))
            .sort((a, b) => semesterRank(b.semester) - semesterRank(a.semester))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load questions.");
      } finally {
        setLoading(false);
      }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const pastCourses = React.useMemo(
    () => Array.from(new Set(past.map((p) => p.courseCode))).sort(),
    [past]
  );
  const pastTopics = React.useMemo(
    () => Array.from(new Set(past.map((p) => p.topic_tag))).sort(),
    [past]
  );
  const filteredPast = past.filter(
    (p) =>
      (courseFilter === "all" || p.courseCode === courseFilter) &&
      (topicFilter === "all" || p.topic_tag === topicFilter)
  );

  const sendToInspector = () => {
    if (typeof window !== "undefined") {
      const text = current.map((q) => q.question_text).join("\n");
      window.sessionStorage.setItem("facultyos:prefill-exam", text);
    }
    router.push("/exam-quality");
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border/80 pb-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Faculty Portal
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
            Question Bank
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <FileQuestion className="h-7 w-7 text-primary shrink-0" />
          Exam Questions &amp; Past Archive
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-1">
          <p className="text-sm text-muted-foreground max-w-3xl">
            Review your active exam questions and browse historical question patterns from past
            semesters.
          </p>
          <AddQuestionsDialog courses={myCourses} onAdded={load} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6" role="tablist">
        <TabButton active={tab === "current"} onClick={() => setTab("current")}>
          <Sparkles className="h-4 w-4" />
          Current Exam Questions ({activeSemester})
        </TabButton>
        <TabButton active={tab === "past"} onClick={() => setTab("past")}>
          <Archive className="h-4 w-4" />
          Past Years Archive
        </TabButton>
      </div>

      {loading && <QuestionsSkeleton />}
      {!loading && error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Current tab */}
      {!loading && !error && tab === "current" && (
        <div className="space-y-4">
          {current.length > 0 && (
            <div className="flex justify-end">
              <Button className="gap-2" onClick={sendToInspector}>
                <Sparkles className="h-4 w-4" />
                Send to Exam Quality Inspector
              </Button>
            </div>
          )}
          {current.length === 0 ? (
            <EmptyState
              title="No active questions"
              message={`No exam questions found for ${activeSemester} in your courses.`}
            />
          ) : (
            current.map((q) => <QuestionCard key={q.id} q={q} showSemester={false} />)
          )}
        </div>
      )}

      {/* Past tab */}
      {!loading && !error && tab === "past" && (
        <div className="space-y-4">
          {past.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filter:
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                aria-label="Filter by course"
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Courses</option>
                {pastCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                aria-label="Filter by topic"
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Topics</option>
                {pastTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
          {filteredPast.length === 0 ? (
            <EmptyState
              title="No archived questions"
              message="No past-year questions match the current filters."
            />
          ) : (
            filteredPast.map((q) => <QuestionCard key={q.id} q={q} showSemester />)
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function QuestionCard({ q, showSemester }: { q: QuestionRow; showSemester: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-primary/10 px-1.5 text-xs font-bold text-primary">
            Q{q.question_number}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {q.courseCode}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {q.topic_tag}
          </span>
          {showSemester && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium border border-secondary/30">
              {q.semester}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-medium border",
              BLOOM_TONE[q.target_blooms] ?? "bg-muted text-muted-foreground border-border"
            )}
          >
            {q.target_blooms}
          </span>
          <span className="text-xs font-bold tabular-nums text-foreground">{q.marks} pts</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{q.question_text}</p>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">{message}</p>
    </div>
  );
}

function QuestionsSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading questions">
      <span className="sr-only">Loading questions…</span>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="h-4 w-40 rounded bg-muted animate-pulse mb-3" />
          <div className="h-3 w-full rounded bg-muted animate-pulse mb-1.5" />
          <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
