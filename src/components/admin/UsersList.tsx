"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/lib/supabase/types";

export function UsersList({ refreshKey }: { refreshKey: number }) {
  const [users, setUsers] = React.useState<AdminUserRow[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load.");
      setUsers(json.data as AdminUserRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold">Couldn&apos;t load users</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-4">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
        <Users className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">No users yet.</p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Student ID</th>
              <th className="px-4 py-2.5 font-medium">Sem.</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-foreground">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className="capitalize text-muted-foreground">
                    {u.role === "faculty" ? "teacher" : u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.student_id ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.current_semester ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      label={u.is_active ? "Active" : "Inactive"}
                      cls={
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    />
                    {u.must_change_password && (
                      <Badge label="Invited" cls="bg-accent/15 text-accent border-accent/30" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", cls)}>
      {label}
    </span>
  );
}
