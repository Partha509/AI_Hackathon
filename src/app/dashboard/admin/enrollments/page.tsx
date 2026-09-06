import Link from "next/link";
import {
  ClipboardList,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCourseApplications,
  getAdminCourses,
  getStudentProfiles,
} from "@/app/actions/admin";
import { EnrollmentManager } from "@/components/admin/EnrollmentManager";

export const dynamic = "force-dynamic";

export default async function AdminEnrollmentsPage() {
  const [appsRes, coursesRes, studentsRes] = await Promise.all([
    getCourseApplications(),
    getAdminCourses(),
    getStudentProfiles(),
  ]);

  const applications = appsRes.applications || [];
  const courses = coursesRes.courses || [];
  const students = studentsRes.students || [];
  const tableExists = appsRes.tableExists;

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter(
    (a) => a.status === "approved"
  ).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard/admin" className="flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Admin Overview</span>
              </Link>
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="outline" className="text-xs font-normal">
              Student Admissions & Enrollment
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <ClipboardList className="h-7 w-7 text-accent" />
            Enrollment & Applications Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Adjudicate student course enrollment petitions, execute direct manual enrollments, and inspect live semester course rosters.
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Pending Review
            </span>
            <span className={`font-heading text-xl font-extrabold ${
              pendingCount > 0 ? "text-amber-500" : "text-foreground"
            }`}>
              {pendingCount}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Enrolled (Approved)
            </span>
            <span className="font-heading text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {approvedCount}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Total Applications
            </span>
            <span className="font-heading text-xl font-extrabold text-foreground">
              {applications.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Enrollment Manager */}
      <EnrollmentManager
        initialApplications={applications}
        courses={courses}
        students={students}
        tableExists={tableExists}
      />
    </div>
  );
}
