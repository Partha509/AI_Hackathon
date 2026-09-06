import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminMetrics,
  getAdminCourses,
  getFacultyProfiles,
  getStudentProfiles,
  getCourseApplications,
} from "@/app/actions/admin";
import { CreateCourseModal } from "@/components/admin/CreateCourseModal";
import { DirectEnrollModal } from "@/components/admin/DirectEnrollModal";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [metricsRes, coursesRes, facultyRes, studentsRes, appsRes] =
    await Promise.all([
      getAdminMetrics(),
      getAdminCourses(),
      getFacultyProfiles(),
      getStudentProfiles(),
      getCourseApplications(),
    ]);

  const metrics = metricsRes.data;
  const courses = coursesRes.courses || [];
  const facultyList = facultyRes.faculty || [];
  const studentsList = studentsRes.students || [];
  const applications = appsRes.applications || [];

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="default" className="bg-primary text-primary-foreground text-xs gap-1">
              <ShieldCheck className="h-3 w-3" />
              Administrative Command Center
            </Badge>
            <span className="text-xs text-muted-foreground">
              AUST CSE Carnival 8.0
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            System Administrator Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Department curriculum management, faculty instructor assignments, and student enrollment arbitration.
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <CreateCourseModal facultyList={facultyList} />
          <DirectEnrollModal
            studentsList={studentsList}
            coursesList={courses}
          />
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/dashboard/admin/enrollments">
              <ClipboardList className="h-4 w-4 text-accent" />
              <span>Review Applications ({metrics.pendingApplications})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Migration Notice if course_applications is not yet created */}
      {!metrics.applicationsTableExists && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">
              Supabase Schema Notice: `course_applications` table pending
            </span>
            <p className="leading-relaxed">
              To activate real-time course application queueing, execute the script at{" "}
              <code className="font-mono bg-background/50 px-1.5 py-0.5 rounded border border-border">
                supabase/admin_portal.sql
              </code>{" "}
              in your Supabase SQL Editor. Course direct enrollment and faculty assignments are fully active!
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Courses */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Offered Courses
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="font-heading text-3xl font-extrabold text-foreground">
            {metrics.totalCourses}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Active Curriculum</span>
            <Link
              href="/dashboard/admin/courses"
              className="text-primary hover:underline flex items-center gap-0.5 font-medium"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-2 hover:border-secondary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Faculty
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="font-heading text-3xl font-extrabold text-foreground">
            {metrics.totalFaculty}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Verified Instructors</span>
            <span className="font-medium text-secondary">Department: CSE</span>
          </div>
        </div>

        {/* Card 3: Students */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Enrolled Students
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="font-heading text-3xl font-extrabold text-foreground">
            {metrics.totalStudents}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Registered Cohort</span>
            <Link
              href="/dashboard/admin/enrollments"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
            >
              Rosters <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Pending Applications */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Applications
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <ClipboardList className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-2">
            <span>{metrics.pendingApplications}</span>
            {metrics.pendingApplications > 0 && (
              <Badge variant="warning" className="text-[11px] animate-pulse">
                Action Required
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Approval Queue</span>
            <Link
              href="/dashboard/admin/enrollments"
              className="text-accent hover:underline flex items-center gap-0.5 font-medium"
            >
              Review <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Course Catalog Preview & Pending Applications Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Course Overview */}
        <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Active Curriculum Catalog
              </h3>
              <p className="text-xs text-muted-foreground">
                Current semester courses and lead instructors
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
              <Link href="/dashboard/admin/courses" className="flex items-center gap-1">
                View All Courses
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Title</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                <TableHead className="text-center">Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.slice(0, 5).map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono font-bold text-primary">
                    {course.code}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {course.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {course.faculty_name || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {course.enrolled_count || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Right 1 Col: Pending Applications Feed */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-accent" />
                Pending Queue
              </h3>
              <p className="text-xs text-muted-foreground">
                Student petitions waiting for review
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-accent">
              <Link href="/dashboard/admin/enrollments">
                Queue
              </Link>
            </Button>
          </div>

          {pendingApps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-8 text-center space-y-2">
              <Sparkles className="mx-auto h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                All student applications are up to date!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApps.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {app.profiles?.full_name || "Student"}
                    </span>
                    <Badge variant="warning" className="text-[10px]">
                      Pending
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Applied for: <strong className="text-foreground">{app.courses?.code || "Course"}</strong>
                  </div>
                  <div className="text-[10px] text-muted-foreground/80">
                    {new Date(app.applied_at).toLocaleDateString()}
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
