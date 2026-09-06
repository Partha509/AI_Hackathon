import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  ArrowRight,
  Sparkles,
  UserPlus,
  Settings,
  Plus,
  AlertCircle,
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
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Header Section: Single Eyebrow Badge, Concise Description, Responsive Action Grid */}
      <div className="space-y-4 border-b border-border/80 pb-6">
        <div className="space-y-1.5">
          {/* Single Eyebrow Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>AUST CSE Carnival 8.0</span>
          </div>

          {/* Title & Short Description */}
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            System Administrator Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Manage courses, faculty, students, and enrollment requests.
          </p>
        </div>

        {/* Action Buttons Row: Responsive Grid (1 col mobile, 2 col sm, 3 col md, 5 col lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Action 1: Create Course Modal */}
          <CreateCourseModal
            facultyList={facultyList}
            trigger={
              <Button className="h-10 w-full justify-center gap-2 text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-xs">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Create New Course</span>
              </Button>
            }
          />

          {/* Action 2: Direct Student Enrollment Modal */}
          <DirectEnrollModal
            studentsList={studentsList}
            coursesList={courses}
            trigger={
              <Button
                variant="outline"
                className="h-10 w-full justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/80 hover:border-emerald-500/30 shadow-xs"
              >
                <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Direct Student Enrollment</span>
              </Button>
            }
          />

          {/* Action 3: Review Petitions */}
          <Button
            asChild
            variant="outline"
            className="h-10 w-full justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/80 hover:border-accent/40 shadow-xs"
          >
            <Link href="/dashboard/admin/enrollments">
              <ClipboardList className="h-4 w-4 text-accent shrink-0" />
              <span className="truncate">
                Review Petitions ({metrics.pendingApplications})
              </span>
            </Link>
          </Button>

          {/* Action 4: Provision Accounts */}
          <Button
            asChild
            variant="outline"
            className="h-10 w-full justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/80 hover:border-primary/30 shadow-xs"
          >
            <Link href="/dashboard/admin/users">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Provision Accounts</span>
            </Link>
          </Button>

          {/* Action 5: Session Settings */}
          <Button
            asChild
            variant="outline"
            className="h-10 w-full justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/80 hover:border-border shadow-xs"
          >
            <Link href="/dashboard/admin/settings">
              <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">Session Settings</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Migration Notice if course_applications is not yet created */}
      {!metrics.applicationsTableExists && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-fade-up">
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

      {/* Stat Cards: Stack 1 col mobile, 2 col tablet, 4 col desktop with Staggered Entrance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Offered Courses */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all duration-200 animate-fade-up stagger-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Offered Courses
              </span>
              <div className="mt-1.5 font-heading text-3xl font-extrabold text-foreground">
                {metrics.totalCourses}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t border-border/50">
            <span>Active Curriculum</span>
            <Link
              href="/dashboard/admin/courses"
              className="text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Active Faculty */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-secondary/40 hover:shadow-sm transition-all duration-200 animate-fade-up stagger-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Active Faculty
              </span>
              <div className="mt-1.5 font-heading text-3xl font-extrabold text-foreground">
                {metrics.totalFaculty}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t border-border/50">
            <span>Verified Instructors</span>
            <span className="font-medium text-secondary">Department: CSE</span>
          </div>
        </div>

        {/* Card 3: Enrolled Students */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-sm transition-all duration-200 animate-fade-up stagger-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Enrolled Students
              </span>
              <div className="mt-1.5 font-heading text-3xl font-extrabold text-foreground">
                {metrics.totalStudents}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t border-border/50">
            <span>Registered Cohort</span>
            <Link
              href="/dashboard/admin/enrollments"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium transition-colors"
            >
              Rosters <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Pending Applications */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-accent/40 hover:shadow-sm transition-all duration-200 animate-fade-up stagger-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Pending Applications
              </span>
              <div className="mt-1.5 font-heading text-3xl font-extrabold text-foreground flex items-center gap-2">
                <span>{metrics.pendingApplications}</span>
                {metrics.pendingApplications > 0 && (
                  <Badge variant="warning" className="text-[11px] font-medium animate-pulse px-2 py-0.5">
                    Action Required
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t border-border/50">
            <span>Approval Queue</span>
            <Link
              href="/dashboard/admin/enrollments"
              className="text-accent hover:underline flex items-center gap-1 font-medium transition-colors"
            >
              Review <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Stack Vertically on Mobile/Tablet (< xl), Side-by-Side on Desktop (xl) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Left: Active Curriculum Catalog Table (Full width on mobile/tablet, 2 cols on xl) */}
        <div className="xl:col-span-2 rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 animate-fade-up stagger-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <span>Active Curriculum Catalog</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current semester courses and lead instructors
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-primary self-start sm:self-auto hover:bg-muted/80 transition-colors"
            >
              <Link href="/dashboard/admin/courses" className="flex items-center gap-1">
                <span>View All Courses</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* Table Container with Controlled Horizontal Scroll for narrow viewports */}
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <Table className="w-full min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Course Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead className="w-[160px]">Assigned Faculty</TableHead>
                  <TableHead className="text-center w-[90px]">Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                      No courses found in the catalog.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.slice(0, 5).map((course) => (
                    <TableRow key={course.id} className="hover:bg-muted/40 transition-colors duration-150">
                      <TableCell className="font-mono font-bold text-primary text-xs sm:text-sm">
                        {course.code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                        {course.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {course.faculty_name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5">
                          {course.enrolled_count || 0}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right: Pending Applications Queue (Full width on mobile/tablet, 1 col on xl) */}
        <div className="xl:col-span-1 rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 animate-fade-up stagger-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-accent shrink-0" />
                <span>Pending Queue</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Student petitions waiting for review
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-accent hover:bg-muted/80 transition-colors"
            >
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
            <div className="space-y-2.5">
              {pendingApps.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-colors duration-150 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {app.profiles?.full_name || "Student"}
                    </span>
                    <Badge variant="warning" className="text-[10px] font-medium px-2 py-0.5 shrink-0">
                      Pending
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Applied for:{" "}
                    <strong className="text-foreground">
                      {app.courses?.code || "Course"}
                    </strong>
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
