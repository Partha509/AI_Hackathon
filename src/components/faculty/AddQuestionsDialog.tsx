"use client";

import * as React from "react";
import { Plus, Trash2, Loader2, FilePlus2 } from "lucide-react";
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
import { addFacultyQuestionsAction } from "@/app/actions/faculty";

const BLOOMS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

interface CourseOption {
  id: string;
  code: string;
  title: string;
}

interface QuestionDraft {
  text: string;
  topic: string;
  blooms: string;
  marks: number;
}

interface AddQuestionsDialogProps {
  courses: CourseOption[];
  onAdded?: () => void;
}

function emptyDraft(): QuestionDraft {
  return { text: "", topic: "", blooms: "Apply", marks: 10 };
}

export function AddQuestionsDialog({ courses, onAdded }: AddQuestionsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [courseId, setCourseId] = React.useState(courses[0]?.id ?? "");
  const [drafts, setDrafts] = React.useState<QuestionDraft[]>([emptyDraft()]);

  React.useEffect(() => {
    if (!courseId && courses[0]) setCourseId(courses[0].id);
  }, [courses, courseId]);

  function updateDraft(index: number, patch: Partial<QuestionDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addRow() {
    setDrafts((prev) => [...prev, emptyDraft()]);
  }

  function removeRow(index: number) {
    setDrafts((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function reset() {
    setDrafts([emptyDraft()]);
    setCourseId(courses[0]?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) {
      toast.error("Select a course.");
      return;
    }
    const valid = drafts.filter((d) => d.text.trim().length > 0);
    if (valid.length === 0) {
      toast.error("Enter at least one question.");
      return;
    }

    setLoading(true);
    const res = await addFacultyQuestionsAction(courseId, valid);
    setLoading(false);

    if (res.success) {
      toast.success(
        `Added ${res.count} question${res.count === 1 ? "" : "s"} to ${res.courseCode}.`
      );
      setOpen(false);
      reset();
      onAdded?.();
    } else {
      toast.error(res.error || "Failed to add questions.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={courses.length === 0}>
          <FilePlus2 className="h-4 w-4" />
          Add Questions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exam Questions</DialogTitle>
          <DialogDescription>
            Manually author one or more questions for your course. They appear under the
            current semester in your question bank.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="qCourse" className="text-xs font-semibold">
              Course
            </Label>
            <select
              id="qCourse"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {drafts.map((d, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/70 bg-card/50 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Question {i + 1}
                  </span>
                  {drafts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <textarea
                  value={d.text}
                  onChange={(e) => updateDraft(i, { text: e.target.value })}
                  placeholder="Write the full question text…"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Topic</Label>
                    <Input
                      value={d.topic}
                      onChange={(e) => updateDraft(i, { topic: e.target.value })}
                      placeholder="e.g. Dynamic Programming"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Bloom&apos;s Level</Label>
                    <select
                      value={d.blooms}
                      onChange={(e) => updateDraft(i, { blooms: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {BLOOMS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={d.marks}
                      onChange={(e) =>
                        updateDraft(i, { marks: parseInt(e.target.value, 10) || 0 })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addRow}
          >
            <Plus className="h-4 w-4" />
            Add another question
          </Button>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving…" : "Save Questions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
