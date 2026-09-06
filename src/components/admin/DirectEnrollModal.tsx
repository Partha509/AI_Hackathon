"use client";

import * as React from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { directEnrollStudentAction } from "@/app/actions/admin";
import type { Course, Profile } from "@/lib/supabase/types";

interface DirectEnrollModalProps {
  studentsList: Profile[];
  coursesList: Course[];
  onEnrolled?: () => void;
  trigger?: React.ReactNode;
}

export function DirectEnrollModal({
  studentsList,
  coursesList,
  onEnrolled,
  trigger,
}: DirectEnrollModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState("");
  const [selectedCourseId, setSelectedCourseId] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId) {
      toast.error("Please select both a student and a course.");
      return;
    }

    setLoading(true);
    const res = await directEnrollStudentAction(
      selectedStudentId,
      selectedCourseId
    );
    setLoading(false);

    if (res.success) {
      toast.success(
        `${res.studentName} successfully enrolled in ${res.courseCode}`
      );
      setOpen(false);
      setSelectedStudentId("");
      setSelectedCourseId("");
      onEnrolled?.();
    } else {
      toast.error(res.error || "Failed to enroll student");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Direct Student Enrollment</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <DialogTitle>Direct Student Enrollment</DialogTitle>
          </div>
          <DialogDescription>
            Manually enroll an active student into a course without waiting for a formal application petition.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="studentSelect" className="text-xs font-semibold">
              Select Student
            </Label>
            <select
              id="studentSelect"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Choose Student --</option>
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="courseSelect" className="text-xs font-semibold">
              Select Target Course
            </Label>
            <select
              id="courseSelect"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Choose Course --</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} &bull; {c.title}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={loading}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? "Enrolling..." : "Enroll Student"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
