"use client";

import * as React from "react";
import { Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { editCourseAction } from "@/app/actions/admin";
import type { Course } from "@/lib/supabase/types";

interface EditCourseModalProps {
  course: Course;
  onUpdated?: () => void;
  trigger?: React.ReactNode;
}

export function EditCourseModal({
  course,
  onUpdated,
  trigger,
}: EditCourseModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState(course.title);
  const [description, setDescription] = React.useState(course.description || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Course title cannot be blank.");
      return;
    }

    setLoading(true);
    const res = await editCourseAction(course.id, {
      title,
      description: description.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      toast.success(`Updated course details for ${course.code}`);
      setOpen(false);
      onUpdated?.();
    } else {
      toast.error(res.error || "Failed to update course");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit2 className="h-4 w-4" />
            </div>
            <DialogTitle>Edit Course Details</DialogTitle>
          </div>
          <DialogDescription>
            Modify curriculum title and description for <strong>{course.code}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="editTitle" className="text-xs font-semibold">
              Course Title
            </Label>
            <Input
              id="editTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-9"
              placeholder="e.g. Compiler Design"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editDescription" className="text-xs font-semibold">
              Course Description
            </Label>
            <textarea
              id="editDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Enter comprehensive course overview or department notes..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
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
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
