"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdvanceSessionResult, AppSettings } from "@/lib/supabase/types";

export function SessionPanel() {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [advancing, setAdvancing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load.");
      setSettings(json.data as AppSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function advance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newSession = String(form.get("newSession") ?? "").trim();
    if (!newSession) {
      toast.error("Enter the new session name.");
      return;
    }
    setAdvancing(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSession }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to advance.");
      const r = json.data as AdvanceSessionResult;
      toast.success(`Now ${r.new_session}. Advanced ${r.advanced}, graduated ${r.graduated}.`);
      setConfirming(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to advance.");
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-primary" /> Academic session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
            <Button onClick={load} variant="outline" size="sm" className="mt-3">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Current session</p>
              <p className="font-heading text-2xl font-bold text-foreground">
                {settings?.current_session}
              </p>
            </div>

            {!confirming ? (
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                Start next session…
              </Button>
            ) : (
              <form onSubmit={advance} className="space-y-3 rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">
                  This advances <span className="font-medium text-foreground">all active students</span> one
                  semester (4.2 graduates). This cannot be undone.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="newSession">New session name</Label>
                  <Input id="newSession" name="newSession" placeholder="Fall 2025" required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={advancing}>
                    {advancing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm advancement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirming(false)}
                    disabled={advancing}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
