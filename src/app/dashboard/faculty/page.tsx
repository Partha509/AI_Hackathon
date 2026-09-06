"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Building2,
  BadgeCheck,
  CalendarDays,
  BookOpen,
  Users,
  ListChecks,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  isCourseForFaculty,
  approvedStudents,
  type Course,
  type Profile,
} from "@/lib/faculty-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const INSTITUTION = "Ahsanullah University of Science and Technology (AUST)";

interface CourseSummary {
  id: string;
  code: string;
  title: string;
  studentCount: number;
  objectiveCount: number;
}

export default function FacultyProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [courses, setCourses] = React.useState<CourseSummary[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in as faculty to view this page.");
      }

      // Profile and the full course list are independent — fetch in parallel.
      const [profRes, coursesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("courses").select("*"),
      ]);

      const { data: prof, error: profErr } = profRes;
      if (profErr || !prof) throw new Error(profErr?.message ?? "Profile not found.");
      setProfile(prof as Profile);

      const { data: allCourses, error: courseErr } = coursesRes;
      if (courseErr) throw new Error(courseErr.message);

      const mine = ((allCourses as Course[]) ?? [])
        .filter((c) => isCourseForFaculty(c, prof as Profile))
        .map<CourseSummary>((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          studentCount: c.enrolled_count ?? approvedStudents(c).length,
          objectiveCount: Array.isArray(c.learning_objectives)
            ? c.learning_objectives.length
            : 0,
        }));
      setCourses(mine);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);

  const createdDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border/80 pb-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Faculty Portal
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
            My Profile
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <User className="h-7 w-7 text-primary shrink-0" />
          Faculty Profile
        </h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatPill icon={BookOpen} tone="primary" label="Assigned Courses" value={String(courses.length)} />
        <StatPill icon={Users} tone="secondary" label="Students Taught" value={String(totalStudents)} />
        <StatPill
          icon={BadgeCheck}
          tone="success"
          label="Verification"
          value="Verified AUST Faculty"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faculty information card */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {(profile?.full_name ?? "F")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">
                {profile?.full_name}
              </p>
              <p className="text-xs text-muted-foreground">
                Faculty Member / Course Instructor
              </p>
            </div>
          </div>

          <dl className="space-y-4">
            <InfoRow icon={Mail} label="Official Email" value={profile?.email ?? "—"} />
            <InfoRow
              icon={Building2}
              label="Department"
              value={
                profile?.department
                  ? `Department of ${profile.department === "CSE" ? "Computer Science & Engineering" : profile.department}`
                  : "—"
              }
            />
            <InfoRow icon={GraduationCap} label="Institution" value={INSTITUTION} />
            <InfoRow icon={CalendarDays} label="Account Created" value={createdDate} />
          </dl>
        </div>

        {/* Teaching portfolio */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Teaching Portfolio
            </h2>
            {courses.length > 0 && (
              <Link
                href="/dashboard/faculty/courses"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                View rosters
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No courses assigned to your profile yet. Please contact the administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                  <p className="font-heading text-base font-bold text-foreground mb-3">
                    {c.code} — {c.title}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-success" />
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {c.studentCount}
                      </span>
                      <span className="text-xs text-muted-foreground">enrolled</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {c.objectiveCount}
                      </span>
                      <span className="text-xs text-muted-foreground">objectives</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: "primary" | "secondary" | "success";
  label: string;
  value: string;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    success: "bg-success/10 text-success border-success/20",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="text-sm text-foreground break-words">{value}</dd>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-border/80 pb-6 mb-8">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 w-full" />
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
