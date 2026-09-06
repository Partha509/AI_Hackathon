"use client";

import * as React from "react";
import { Users, UserMinus, ShieldAlert, GraduationCap, Mail } from "lucide-react";
import { toast } from "sonner";
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
import { revokeEnrollmentAction } from "@/app/actions/admin";
import type { Course } from "@/lib/supabase/types";

interface CourseRosterViewerProps {
  courses: Course[];
  onRosterChanged?: () => void;
}

export function CourseRosterViewer({
  courses,
  onRosterChanged,
}: CourseRosterViewerProps) {
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>(
    courses[0]?.id || ""
  );
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const enrolledStudents: any[] = Array.isArray(activeCourse?.enrolled_students)
    ? activeCourse.enrolled_students
    : [];

  async function handleRevoke(studentIdOrEmail: string, studentName: string) {
    if (!activeCourse) return;
    if (!confirm(`Are you sure you want to revoke enrollment for ${studentName}?`)) {
      return;
    }

    setRevokingId(studentIdOrEmail);
    const res = await revokeEnrollmentAction(activeCourse.id, studentIdOrEmail);
    setRevokingId(null);

    if (res.success) {
      toast.success(`Revoked enrollment for ${studentName}`);
      onRosterChanged?.();
    } else {
      toast.error(res.error || "Failed to revoke enrollment");
    }
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">
              Active Course Rosters
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            View active cohorts, verified student IDs, and manage enrollment revocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} &bull; {c.title} ({c.enrolled_count || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeCourse && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>{activeCourse.code}: {activeCourse.title}</span>
          </div>
          <span>&bull;</span>
          <div>
            Lead Instructor: <strong className="text-foreground">{activeCourse.faculty_name || "Unassigned"}</strong>
          </div>
          <span>&bull;</span>
          <div>
            Enrolled Cohort: <strong className="text-primary">{enrolledStudents.length} Students</strong>
          </div>
        </div>
      )}

      {enrolledStudents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/80 py-10 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <h4 className="text-sm font-semibold text-foreground">
            No Students Currently Enrolled
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            There are no approved students in this course roster yet. Use the Direct Enrollment tool or approve pending applications.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>University ID / Email</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolledStudents.map((student: any, idx: number) => {
              const studentId = student.student_id || student.email || String(idx);
              const isRevoking = revokingId === studentId;

              return (
                <TableRow key={studentId}>
                  <TableCell className="font-semibold text-foreground">
                    {student.student_name || "Student"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{student.email || student.student_id || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {student.semester || "Spring 2025"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" className="text-[10px]">
                      Enrolled
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRevoke(studentId, student.student_name || "Student")
                      }
                      disabled={isRevoking}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      <span>{isRevoking ? "Revoking..." : "Revoke"}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
