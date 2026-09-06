import Link from "next/link";
import { ArrowRight, LogIn, Sparkles, UserPlus } from "lucide-react";
import { ROLE_KEYS, ROLES } from "@/lib/auth-roles";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Choose your role | FacultyOS",
  description:
    "Sign in or create an account as a Teacher, Student, or Administrator.",
};

export default function AuthLandingPage() {
  return (
    <div className="flex-1 bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Welcome to FacultyOS</span>
          </div>
          <h1 className="font-heading max-w-2xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Choose how you&apos;d like to{" "}
            <span className="text-primary underline decoration-accent/60 underline-offset-8">
              continue
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Select your role to sign in or create an account. Each experience is
            tailored to your responsibilities within the institution.
          </p>
        </div>

        {/* Role cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_KEYS.map((key) => {
            const role = ROLES[key];
            const Icon = role.icon;

            return (
              <div
                key={key}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border",
                    role.accentBg
                  )}
                >
                  <Icon className={cn("h-6 w-6", role.accentText)} />
                </div>

                <h2 className="mt-5 font-heading text-xl font-bold text-foreground">
                  {role.label}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {role.description}
                </p>

                <ul className="mt-4 space-y-2">
                  {role.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <ArrowRight
                        className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", role.accentText)}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-col gap-2.5 border-t border-border/60 pt-5">
                  <Link
                    href={`/auth/${key}/login`}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      role.accentRing
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in as {role.label}
                  </Link>

                  {role.allowSignup ? (
                    <Link
                      href={`/auth/${key}/signup`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </Link>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Administrator accounts are provisioned by the institution.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Just exploring?{" "}
          <Link
            href="/"
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Return to the overview
          </Link>
        </p>
      </div>
    </div>
  );
}
