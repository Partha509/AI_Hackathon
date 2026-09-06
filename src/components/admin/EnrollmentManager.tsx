"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Users,
  Search,
  Check,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Inbox,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DirectEnrollModal } from "@/components/admin/DirectEnrollModal";
import { CourseRosterViewer } from "@/components/admin/CourseRosterViewer";
import { updateApplicationStatusAction } from "@/app/actions/admin";
import type { Course, CourseApplication, Profile } from "@/lib/supabase/types";

interface EnrollmentManagerProps {
  initialApplications: CourseApplication[];
  courses: Course[];
  students: Profile[];
  tableExists: boolean;
}

export function EnrollmentManager({
  initialApplications,
  courses,
  students,
  tableExists,
}: EnrollmentManagerProps) {
  const router = useRouter();
  const [applications, setApplications] = React.useState<CourseApplication[]>(
    initialApplications
  );
  const [activeTab, setActiveTab] = React.useState<
    "queue" | "rosters" | "direct"
  >("queue");
  const [statusFilter, setStatusFilter] = React.useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Sync with prop updates
  React.useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const handleRefresh = () => {
    router.refresh();
  };

  // Counts
  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter(
    (a) => a.status === "approved"
  ).length;
  const rejectedCount = applications.filter(
    (a) => a.status === "rejected"
  ).length;

  // Filtered applications
  const filteredApps = React.useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "all" ? true : app.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const studentName = app.profiles?.full_name?.toLowerCase() || "";
      const studentEmail = app.profiles?.email?.toLowerCase() || "";
      const courseCode = app.courses?.code?.toLowerCase() || "";
      const courseTitle = app.courses?.title?.toLowerCase() || "";

      const matchesSearch =
        studentName.includes(q) ||
        studentEmail.includes(q) ||
        courseCode.includes(q) ||
        courseTitle.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  async function handleStatusChange(
    appId: string,
    newStatus: "approved" | "rejected",
    studentName: string,
    courseCode: string
  ) {
    setProcessingId(appId);

    // Optimistic UI state update
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: newStatus,
              reviewed_at: new Date().toISOString(),
            }
          : a
      )
    );

    const res = await updateApplicationStatusAction(appId, newStatus);
    setProcessingId(null);

    if (res.success) {
      if (newStatus === "approved") {
        toast.success(
          `Approved application: ${studentName} enrolled in ${courseCode}`
        );
      } else {
        toast.error(`Rejected application for ${studentName} in ${courseCode}`);
      }
      handleRefresh();
    } else {
      toast.error(res.error || "Failed to update application status");
      // Revert if error
      setApplications(initialApplications);
    }
  }

  return (
    <div className="space-y-8">
      {/* Schema Migration Advisory if table is not yet created */}
      {!tableExists && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">
              Notice: Supabase `course_applications` table pending
            </span>
            <p className="leading-relaxed">
              Real-time application petition queuing can be activated in Supabase by running{" "}
              <code className="font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border">
                supabase/admin_portal.sql
              </code>. Fallback demonstration records and course roster management are currently fully interactive.
            </p>
          </div>
        </div>
      )}

      {/* Main Mode Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "queue" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("queue")}
            className="gap-2 text-xs font-semibold"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Applications Queue</span>
            {pendingCount > 0 && (
              <Badge
                variant="warning"
                className="ml-1 px-1.5 py-0 text-[10px] leading-tight"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>

          <Button
            variant={activeTab === "rosters" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("rosters")}
            className="gap-2 text-xs font-semibold"
          >
            <Users className="h-4 w-4" />
            <span>Active Course Rosters</span>
          </Button>
        </div>

        {/* Quick Action: Direct Student Enrollment */}
        <div className="flex items-center gap-2">
          <DirectEnrollModal
            studentsList={students}
            coursesList={courses}
            onEnrolled={handleRefresh}
          />
        </div>
      </div>

      {/* VIEW 1: Applications Queue */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className="h-8 text-xs gap-1.5"
              >
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Pending Review</span>
                <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">
                  {pendingCount}
                </span>
              </Button>

              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
                className="h-8 text-xs gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Approved</span>
                <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">
                  {approvedCount}
                </span>
              </Button>

              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
                className="h-8 text-xs gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span>Rejected</span>
                <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">
                  {rejectedCount}
                </span>
              </Button>

              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 text-xs"
              >
                <span>All ({applications.length})</span>
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or course..."
                className="pl-9 h-8.5 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Table or Explicit Empty State */}
          {filteredApps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                {statusFilter === "pending" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <Inbox className="h-6 w-6" />
                )}
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">
                {statusFilter === "pending"
                  ? "No pending course applications to review"
                  : "No applications found in this view"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {statusFilter === "pending"
                  ? "All student course enrollment applications have been processed and reviewed by administration."
                  : "No course applications match your selected status filter or search parameters."}
              </p>
              {statusFilter !== "all" && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-xs"
                  >
                    View All Applications
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="min-w-[220px] font-semibold text-foreground">
                      Student Applicant
                    </TableHead>
                    <TableHead className="min-w-[220px] font-semibold text-foreground">
                      Requested Course
                    </TableHead>
                    <TableHead className="w-[160px] font-semibold text-foreground">
                      Applied Date
                    </TableHead>
                    <TableHead className="w-[130px] font-semibold text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="w-[200px] text-right font-semibold text-foreground">
                      Adjudication Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => {
                    const student = app.profiles;
                    const course = app.courses;
                    const studentName = student?.full_name || "Enrolled Student";
                    const studentEmail = student?.email || app.student_id;
                    const courseCode = course?.code || "COURSE";
                    const courseTitle = course?.title || "Academic Course";
                    const isProcessing = processingId === app.id;

                    return (
                      <TableRow key={app.id} className="hover:bg-muted/20">
                        {/* Student Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-foreground block text-sm">
                                {studentName}
                              </span>
                              <span className="text-xs text-muted-foreground block font-mono">
                                {studentEmail}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Requested Course */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary text-xs">
                                {courseCode}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 font-mono"
                              >
                                {course?.department || "CSE"}
                              </Badge>
                            </div>
                            <span className="text-xs font-medium text-foreground block">
                              {courseTitle}
                            </span>
                            {course?.faculty_name && (
                              <span className="text-[11px] text-muted-foreground block">
                                Lead: {course.faculty_name}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Applied Timestamp */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>
                              {app.applied_at
                                ? new Date(app.applied_at).toLocaleDateString(
                                    undefined,
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )
                                : "Recent"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          {app.status === "pending" && (
                            <Badge
                              variant="warning"
                              className="gap-1 text-[11px] font-semibold py-0.5"
                            >
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {app.status === "approved" && (
                            <Badge
                              variant="success"
                              className="gap-1 text-[11px] font-semibold py-0.5"
                            >
                              <Check className="h-3 w-3" />
                              Approved
                            </Badge>
                          )}
                          {app.status === "rejected" && (
                            <Badge
                              variant="destructive"
                              className="gap-1 text-[11px] font-semibold py-0.5"
                            >
                              <X className="h-3 w-3" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right">
                          {app.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(
                                    app.id,
                                    "approved",
                                    studentName,
                                    courseCode
                                  )
                                }
                                disabled={isProcessing}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-3 shadow-xs"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                <span>Approve</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(
                                    app.id,
                                    "rejected",
                                    studentName,
                                    courseCode
                                  )
                                }
                                disabled={isProcessing}
                                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/40 gap-1 px-3"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                              <span>
                                {app.status === "approved"
                                  ? "Enrolled"
                                  : "Dismissed"}
                              </span>
                              {app.reviewed_at && (
                                <span className="text-[10px] text-muted-foreground/60">
                                  &bull;{" "}
                                  {new Date(app.reviewed_at).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" }
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Active Course Rosters */}
      {activeTab === "rosters" && (
        <CourseRosterViewer courses={courses} onRosterChanged={handleRefresh} />
      )}
    </div>
  );
}
