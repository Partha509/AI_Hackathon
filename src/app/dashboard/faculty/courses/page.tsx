"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  FileQuestion,
  ChevronDown,
  GraduationCap,
  Mail,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  isCourseForFaculty,
  approvedStudents,
  currentSemester,
  type Course,
  type Exam,
  type ExamQuestion,
  type Profile,
} from "@/lib/faculty-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseView {
  course: Course;
  semester: string;
  studentCount: number;
  questionCount: number;
}

export default function FacultyCoursesPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [views, setViews] = React.useState<CourseView[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [deptByEmail, setDeptByEmail] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const supabase = createClient();

    async function load() {
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
        setProfile(prof as Profile);

        const [{ data: courses }, { data: exams }, { data: questions }, { data: students }] =
          await Promise.all([
            supabase.from("courses").select("*"),
            supabase.from("exams").select("*"),
            supabase.from("exam_questions").select("*"),
            supabase.from("profiles").select("email, department").eq("role", "student"),
          ]);

        const deptMap: Record<string, string> = {};
        for (const s of (students as Pick<Profile, "email" | "department">[]) ?? []) {
          if (s.email) deptMap[s.email] = s.department ?? "CSE";
        }
        setDeptByEmail(deptMap);

        const mine = ((courses as Course[]) ?? []).filter((c) =>
          isCourseForFaculty(c, prof as Profile)
        );
        const examList = (exams as Exam[]) ?? [];
        const questionList = (questions as ExamQuestion[]) ?? [];

        const built: CourseView[] = mine.map((course) => {
          const courseExams = examList.filter((e) => e.course_id === course.id);
          const examIds = new Set(courseExams.map((e) => e.id));
          const sem = currentSemester(courseExams);
          const currentExamIds = new Set(
            courseExams.filter((e) => e.semester === sem).map((e) => e.id)
          );
          const questionCount = questionList.filter((q) =>
            currentExamIds.size ? currentExamIds.has(q.exam_id) : examIds.has(q.exam_id)
          ).length;
          return {
            course,
            semester: sem,
            studentCount: course.enrolled_count ?? approvedStudents(course).length,
            questionCount,
          };
        });
        setViews(built);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border/80 pb-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Faculty Portal
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
            My Assignments
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BookOpen className="h-7 w-7 text-primary shrink-0" />
          My Courses &amp; Students
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Courses assigned to {profile?.full_name ?? "you"} — with approved enrollment rosters and
          active exam question counts.
        </p>
      </div>

      {loading && <CoursesSkeleton />}

      {!loading && error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && views.length === 0 && (
        <EmptyState
          title="No assigned courses"
          message="You are not currently assigned to any courses. Contact your department admin to be added as an examiner."
        />
      )}

      {!loading && !error && views.length > 0 && (
        <div className="space-y-5">
          {views.map((v) => {
            const isOpen = expanded === v.course.id;
            const students = approvedStudents(v.course);
            return (
              <div key={v.course.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading text-lg font-bold text-foreground">
                        {v.course.code} — {v.course.title}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {v.semester}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <Stat icon={Users} tone="text-success" label="Approved Students" value={v.studentCount} />
                      <Stat icon={FileQuestion} tone="text-primary" label="Active Questions" value={v.questionCount} />
                      <Stat
                        icon={GraduationCap}
                        tone="text-secondary"
                        label="Examiners"
                        value={v.course.assigned_faculty?.length ?? 1}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 shrink-0"
                    onClick={() => setExpanded(isOpen ? null : v.course.id)}
                    aria-expanded={isOpen}
                    aria-controls={`roster-${v.course.id}`}
                  >
                    <Users className="h-4 w-4" />
                    View Enrolled Students
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </Button>
                </div>

                {isOpen && (
                  <div id={`roster-${v.course.id}`} className="border-t border-border">
                    {students.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No students currently enrolled in this course.
                      </div>
                    ) : (
                      <>
                        <div className="hidden md:grid grid-cols-[2fr_1.2fr_0.8fr_1fr] gap-4 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
                          <span>Student</span>
                          <span>Student ID</span>
                          <span>Department</span>
                          <span>Semester</span>
                        </div>
                        <ul className="divide-y divide-border">
                          {students.map((s, i) => (
                            <li
                              key={`${s.student_id}-${i}`}
                              className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_0.8fr_1fr] gap-1 md:gap-4 px-5 py-3 md:items-center"
                            >
                              <span className="text-sm text-foreground flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-semibold border border-success/30">
                                  Approved
                                </span>
                                {s.student_name}
                                {s.email && (
                                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {s.email}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-xs text-foreground">{s.student_id}</span>
                              <span className="text-sm text-muted-foreground">
                                {(s.email && deptByEmail[s.email]) || "CSE"}
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {s.semester ?? v.semester}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", tone)} />
      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
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

function CoursesSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading courses">
      <span className="sr-only">Loading courses…</span>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="h-5 w-64 rounded bg-muted animate-pulse mb-3" />
          <div className="flex gap-4">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
