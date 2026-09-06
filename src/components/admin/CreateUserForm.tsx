"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEMESTERS } from "@/lib/semester";
import type { CreateUserResult } from "@/lib/supabase/types";

export function CreateUserForm({ onCreated }: { onCreated?: () => void }) {
  const [role, setRole] = React.useState<"student" | "faculty">("student");
  const [submitting, setSubmitting] = React.useState(false);
  const [lastInvite, setLastInvite] = React.useState<CreateUserResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? "").trim(),
      full_name: String(form.get("full_name") ?? "").trim(),
      role,
      department: String(form.get("department") ?? "CSE").trim(),
      student_id: role === "student" ? String(form.get("student_id") ?? "").trim() : undefined,
      current_semester: role === "student" ? String(form.get("current_semester") ?? "") : undefined,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to create user.");
      setLastInvite(json.data as CreateUserResult);
      toast.success(`Invitation created for ${payload.email}.`);
      (e.target as HTMLFormElement).reset();
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" /> Create student / teacher ID
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(["student", "faculty"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={
                  "flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                  (role === r
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-muted")
                }
                aria-pressed={role === r}
              >
                {r === "faculty" ? "Teacher" : "Student"}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="jane@aust.edu" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" defaultValue="CSE" />
            </div>
            {role === "student" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input id="student_id" name="student_id" required placeholder="21.01.04.099" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="current_semester">Current semester</Label>
                  <select
                    id="current_semester"
                    name="current_semester"
                    defaultValue="1.1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Create &amp; send invite
          </Button>
        </form>

        {lastInvite && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Invitation ready for {lastInvite.email}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              An email is sent when SMTP is configured. You can also copy the invite link:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={lastInvite.invite_link}
                className="flex-1 rounded-md border border-input bg-muted/40 px-2 py-1.5 text-xs text-foreground"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(lastInvite.invite_link);
                  toast.success("Invite link copied.");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
