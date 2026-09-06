"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME } from "@/lib/access-control";
import type { DbRole } from "@/lib/auth-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Phase = "checking" | "ready" | "no-session";

export function SetPasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("checking");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    // Invite/recovery links establish a session (detected from the URL).
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setPhase(session ? "ready" : "no-session");
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setPhase("ready");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    try {
      const { data: updated, error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw pwErr;

      const userId = updated.user?.id;
      let role: DbRole = "student";
      if (userId) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        role = (profile?.role as DbRole) ?? "student";
      }

      toast.success("Password set. Welcome to FacultyOS!");
      router.push(ROLE_HOME[role]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>Set your password</CardTitle>
            <CardDescription>
              Create a password to activate your FacultyOS account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {phase === "checking" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying your invitation…
            </div>
          )}

          {phase === "no-session" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Invitation link required</p>
              <p className="mt-1 text-muted-foreground">
                Open the invitation link from your email to set your password. If the link expired,
                ask an administrator to re-send it.
              </p>
            </div>
          )}

          {phase === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm"
                    name="confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Set password &amp; continue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
