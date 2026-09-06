"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
  GraduationCap,
  Sparkles,
  Search,
  FilterX,
  Send,
  Loader2,
  AlertCircle,
  Calendar,
  Hash,
  Layers,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { applyForCourseAction } from "@/app/actions/student";
import type { Course, Profile, Semester } from "@/lib/supabase/types";

interface EnrichedCourse extends Course {
  parsedSemester: Semester | null;
  isEnrolled: boolean;
  hasApplied: boolean;
  applicationStatus: "pending" | "approved" | "rejected" | "enrolled" | null;
  isEligible: boolean;
  requiredSemester: Semester | null;
  eligibilityReason?: string;
}

interface StudentCourseApplicationViewProps {
  student: Profile;
  courses: EnrichedCourse[];
}

export function StudentCourseApplicationView({
  student,
  courses: initialCourses,
}: StudentCourseApplicationViewProps) {
  const router = useRouter();
  const [courses, setCourses] = React.useState<EnrichedCourse[]>(initialCourses);
  const [filterTab, setFilterTab] = React.useState<"eligible" | "all" | "applied">(
    "eligible"
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [applyingCourseId, setApplyingCourseId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const studentSemester = student.current_semester || "3.2";

  // Filtered courses
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      // Tab filter
      if (filterTab === "eligible") {
        if (!c.isEligible) return false;
      } else if (filterTab === "applied") {
        if (!c.hasApplied) return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const codeMatch = c.code.toLowerCase().includes(q);
      const titleMatch = c.title.toLowerCase().includes(q);
      const facultyMatch = c.faculty_name?.toLowerCase().includes(q);

      return codeMatch || titleMatch || facultyMatch;
    });
  }, [courses, filterTab, searchQuery]);

  async function handleApply(courseId: string, courseCode: string) {
    setApplyingCourseId(courseId);
    const res = await applyForCourseAction(student.id, courseId);
    setApplyingCourseId(null);

    if (res.success) {
      toast.success(`Application submitted for ${res.courseCode}!`);
      // Update local state optimistically
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                hasApplied: true,
                applicationStatus: "pending",
              }
            : c
        )
      );
      router.refresh();
    } else {
      toast.error(res.error || "Failed to submit course application");
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Academic Standing Banner */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent font-bold text-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {student.full_name}
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {student.department || "CSE"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Hash className="h-3 w-3" />
                  ID: <strong className="text-foreground">{student.student_id_number || "21.01.04.099"}</strong>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Current Semester:{" "}
                  <strong className="text-primary font-mono font-bold">
                    Semester {studentSemester}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary font-medium text-center">
              <span>Enrollment Eligibility:</span>
              <strong className="block font-bold">
                Semester {studentSemester} Courses Only
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Button
            variant={filterTab === "eligible" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab("eligible")}
            className="h-8 text-xs gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Eligible Courses ({courses.filter((c) => c.isEligible).length})</span>
          </Button>

          <Button
            variant={filterTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab("all")}
            className="h-8 text-xs"
          >
            <span>All Department Courses ({courses.length})</span>
          </Button>

          <Button
            variant={filterTab === "applied" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab("applied")}
            className="h-8 text-xs gap-1.5"
          >
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span>My Applications ({courses.filter((c) => c.hasApplied).length})</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or title..."
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

      {/* Catalog Table */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <FilterX className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            No courses found
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {filterTab === "eligible"
              ? `There are no courses currently offered for Semester ${studentSemester} matching your search.`
              : filterTab === "applied"
              ? "You have not submitted course applications yet."
              : "No courses match your active search query."}
          </p>
          {filterTab !== "all" && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterTab("all");
                  setSearchQuery("");
                }}
                className="text-xs"
              >
                Browse All Courses
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px] font-semibold text-foreground">
                  Course Code
                </TableHead>
                <TableHead className="min-w-[220px] font-semibold text-foreground">
                  Course Title
                </TableHead>
                <TableHead className="w-[140px] text-center font-semibold text-foreground">
                  Curriculum Level
                </TableHead>
                <TableHead className="min-w-[180px] font-semibold text-foreground">
                  Lead Instructor
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[190px] text-right font-semibold text-foreground">
                  Application Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => {
                const isApplying = applyingCourseId === course.id;
                const semMatch = course.isEligible;
                const reqSem = course.parsedSemester;

                return (
                  <TableRow key={course.id} className="hover:bg-muted/20">
                    {/* Course Code */}
                    <TableCell className="font-mono font-bold text-primary text-sm">
                      {course.code}
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <div>
                        <span className="font-semibold text-foreground block text-sm">
                          {course.title}
                        </span>
                        {course.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Semester Level */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs font-mono font-bold ${
                          semMatch
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {reqSem ? `Semester ${reqSem}` : "General"}
                      </Badge>
                    </TableCell>

                    {/* Instructor */}
                    <TableCell className="text-xs text-muted-foreground">
                      {course.faculty_name || "Unassigned"}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {course.applicationStatus === "enrolled" && (
                        <Badge variant="success" className="gap-1 text-[11px] py-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Enrolled
                        </Badge>
                      )}
                      {course.applicationStatus === "pending" && (
                        <Badge variant="warning" className="gap-1 text-[11px] py-0.5">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </Badge>
                      )}
                      {course.applicationStatus === "rejected" && (
                        <Badge variant="destructive" className="gap-1 text-[11px] py-0.5">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                      {!course.applicationStatus && (
                        <span className="text-xs text-muted-foreground">Not Applied</span>
                      )}
                    </TableCell>

                    {/* Action Button with Lock Tooltip */}
                    <TableCell className="text-right">
                      {course.applicationStatus === "enrolled" ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Active Roster
                        </span>
                      ) : course.applicationStatus === "pending" ? (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          In Review Queue
                        </span>
                      ) : semMatch ? (
                        /* Eligible: Enabled Apply Button */
                        <Button
                          size="sm"
                          onClick={() => handleApply(course.id, course.code)}
                          disabled={isApplying}
                          className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 px-3"
                        >
                          {isApplying ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Apply for Course</span>
                        </Button>
                      ) : (
                        /* Ineligible: Disabled Button with Lock Icon & Tooltip */
                        <div className="relative group inline-block">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="h-8 text-xs gap-1.5 opacity-60 cursor-not-allowed border-muted-foreground/30"
                          >
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Apply</span>
                          </Button>

                          {/* Hover Tooltip explaining restriction */}
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 rounded-lg bg-popover p-2.5 text-xs text-popover-foreground shadow-lg border border-border">
                            <div className="flex items-start gap-2">
                              <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="leading-tight">
                                You can only apply to courses in semester [
                                <strong>{reqSem}</strong>]. Your current semester is [
                                <strong>{studentSemester}</strong>].
                              </p>
                            </div>
                          </div>
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
  );
}
