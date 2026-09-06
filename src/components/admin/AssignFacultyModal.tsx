"use client";

import * as React from "react";
import { UserCheck, Loader2 } from "lucide-react";
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
import { assignFacultyAction } from "@/app/actions/admin";
import type { Course, Profile } from "@/lib/supabase/types";

interface AssignFacultyModalProps {
  course: Course;
  facultyList: Profile[];
  onAssigned?: () => void;
  trigger?: React.ReactNode;
}

export function AssignFacultyModal({
  course,
  facultyList,
  onAssigned,
  trigger,
}: AssignFacultyModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = React.useState(
    course.faculty_id || ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFacultyId) {
      toast.error("Please select a faculty member.");
      return;
    }

    const selectedFaculty = facultyList.find((f) => f.id === selectedFacultyId);
    if (!selectedFaculty) return;

    setLoading(true);
    const res = await assignFacultyAction(
      course.id,
      selectedFaculty.id,
      selectedFaculty.full_name
    );
    setLoading(false);

    if (res.success) {
      toast.success(
        `Assigned ${selectedFaculty.full_name} to ${course.code}`
      );
      setOpen(false);
      onAssigned?.();
    } else {
      toast.error(res.error || "Failed to assign faculty");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Assign / Change Faculty</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </div>
            <DialogTitle>Assign Course Faculty</DialogTitle>
          </div>
          <DialogDescription>
            Assign or reassign the primary faculty instructor for{" "}
            <strong className="text-foreground">{course.code}: {course.title}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1 border border-border/60">
            <div className="text-muted-foreground">Current Instructor:</div>
            <div className="font-semibold text-foreground">
              {course.faculty_name || "Unassigned"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="facultyPick" className="text-xs font-semibold">
              Select New Faculty Instructor
            </Label>
            <select
              id="facultyPick"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Choose Registered Faculty --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} &bull; {f.department || "CSE"} ({f.email})
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
              className="bg-primary hover:bg-primary/90 gap-1.5 text-primary-foreground"
              disabled={loading}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? "Updating..." : "Confirm Assignment"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
