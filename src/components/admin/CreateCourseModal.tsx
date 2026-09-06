"use client";

import * as React from "react";
import { Plus, BookOpen, Loader2 } from "lucide-react";
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
import { createCourseAction } from "@/app/actions/admin";
import type { Profile } from "@/lib/supabase/types";

interface CreateCourseModalProps {
  facultyList: Profile[];
  onCourseCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateCourseModal({
  facultyList,
  onCourseCreated,
  trigger,
}: CreateCourseModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("CSE");
  const [selectedFacultyId, setSelectedFacultyId] = React.useState("");
  const [topicsInput, setTopicsInput] = React.useState(
    "Introduction, Core Concepts, Practical Implementation, Advanced Applications"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      toast.error("Course code and title are required.");
      return;
    }

    setLoading(true);

    const selectedFaculty = facultyList.find((f) => f.id === selectedFacultyId);

    const topics = topicsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const result = await createCourseAction({
      code,
      title,
      department,
      facultyId: selectedFaculty?.id,
      facultyName: selectedFaculty?.full_name,
      topics,
    });

    setLoading(false);

    if (result.success) {
      toast.success(`Course ${code.toUpperCase()} created successfully!`);
      setOpen(false);
      setCode("");
      setTitle("");
      onCourseCreated?.();
    } else {
      toast.error(result.error || "Failed to create course");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Create New Course</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <DialogTitle>Create New Course</DialogTitle>
          </div>
          <DialogDescription>
            Register a new university curriculum course, assign initial faculty, and initialize syllabus topics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="courseCode" className="text-xs font-semibold">
                Course Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="courseCode"
                placeholder="e.g. CSE 323"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="h-9 font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-semibold">
                Department
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="courseTitle" className="text-xs font-semibold">
              Course Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="courseTitle"
              placeholder="e.g. Compiler Design & Syntax Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="facultySelector" className="text-xs font-semibold">
              Assign Initial Faculty Instructor
            </Label>
            <select
              id="facultySelector"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Select Faculty (Optional) --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topics" className="text-xs font-semibold">
              Initial Syllabus Topics (Comma-separated)
            </Label>
            <textarea
              id="topics"
              rows={3}
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Lexical Analysis, Parsing, Syntax Directed Translation, Code Generation"
            />
            <p className="text-[11px] text-muted-foreground">
              These topics will automatically seed the syllabus checker benchmark.
            </p>
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
              <span>{loading ? "Creating..." : "Save Course"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
