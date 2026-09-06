"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { ROLES, type RoleKey } from "@/lib/auth-roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  role: RoleKey;
  mode: AuthMode;
}

export function AuthForm({ role, mode }: AuthFormProps) {
  const router = useRouter();
  const config = ROLES[role];
  const Icon = config.icon;
  const isSignup = mode === "signup";

  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(data: Record<string, string>) {
    const next: Record<string, string> = {};
    if (isSignup && !data.fullName?.trim()) {
      next.fullName = "Please enter your full name.";
    }
    if (!data.email?.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!data.password) {
      next.password = "Password is required.";
    } else if (isSignup && data.password.length < 8) {
      next.password = "Use at least 8 characters.";
    }
    if (isSignup && data.confirmPassword !== data.password) {
      next.confirmPassword = "Passwords do not match.";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries()) as Record<string, string>;

    const validation = validate(data);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setIsSubmitting(true);
    // Auth backend not wired yet — simulate the request so the flow is demoable.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);

    toast.success(
      isSignup
        ? `${config.label} account created. Welcome to FacultyOS!`
        : `Signed in as ${config.label}.`
    );
    router.push(config.landingHref);
  }

  const oppositeHref = isSignup
    ? `/auth/${role}/login`
    : `/auth/${role}/signup`;

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/auth"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <ArrowLeft className="h-4 w-4" />
        Choose a different role
      </Link>

      <Card>
        <CardHeader className="space-y-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border",
              config.accentBg
            )}
          >
            <Icon className={cn("h-6 w-6", config.accentText)} />
          </div>
          <div className="space-y-1.5">
            <CardTitle>
              {isSignup ? "Create your" : "Sign in to your"}{" "}
              <span className={config.accentText}>{config.label}</span> account
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isSignup && (
              <Field
                id="fullName"
                label="Full name"
                error={errors.fullName}
                icon={UserIcon}
              >
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Dr. Tanvir Ahmed"
                  className="pl-9"
                  aria-invalid={!!errors.fullName}
                />
              </Field>
            )}

            <Field id="email" label="Email" error={errors.email} icon={Mail}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                className="pl-9"
                aria-invalid={!!errors.email}
              />
            </Field>

            <Field
              id="password"
              label="Password"
              error={errors.password}
              icon={Lock}
              action={
                !isSignup ? (
                  <Link
                    href="#"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    Forgot password?
                  </Link>
                ) : undefined
              }
            >
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "At least 8 characters" : "••••••••"}
                  className="pl-9 pr-10"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            {isSignup && (
              <Field
                id="confirmPassword"
                label="Confirm password"
                error={errors.confirmPassword}
                icon={Lock}
              >
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="pl-9"
                  aria-invalid={!!errors.confirmPassword}
                />
              </Field>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignup ? "Creating account…" : "Signing in…"}
                </>
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        {config.allowSignup && (
          <CardFooter className="justify-center border-t border-border/60 pt-4">
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "New to FacultyOS?"}{" "}
              <Link
                href={oppositeHref}
                className={cn(
                  "font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                  config.accentText
                )}
              >
                {isSignup ? "Sign in" : `Create a ${config.noun}`}
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        AI Advisory: Final evaluation decisions remain with faculty.
      </p>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ id, label, error, icon: Icon, action, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
