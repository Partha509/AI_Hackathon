import { GraduationCap, Users, ShieldCheck, type LucideIcon } from "lucide-react";

export type RoleKey = "teacher" | "student" | "admin";

/** Role value stored in the `profiles.role` column (schema constraint). */
export type DbRole = "faculty" | "student" | "admin";

export interface RoleConfig {
  key: RoleKey;
  /** Maps the UI role to the DB `profiles.role` value. */
  dbRole: DbRole;
  label: string;
  /** Short noun shown in copy, e.g. "faculty account". */
  noun: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind accent classes derived from the design tokens. */
  accentText: string;
  accentBg: string;
  accentRing: string;
  /** Whether self-service signup is available for this role. */
  allowSignup: boolean;
  /** Where the user lands after a successful auth (placeholder destinations). */
  landingHref: string;
  /** Role-specific perks surfaced on the auth screens. */
  highlights: string[];
}

export const ROLES: Record<RoleKey, RoleConfig> = {
  teacher: {
    key: "teacher",
    dbRole: "faculty",
    label: "Teacher",
    noun: "faculty account",
    description:
      "Audit exam quality, resolve grading variance, and arbitrate student disputes with your AI co-pilot.",
    icon: GraduationCap,
    accentText: "text-primary",
    accentBg: "bg-primary/10 border-primary/20",
    accentRing: "focus-visible:ring-primary",
    allowSignup: true,
    landingHref: "/copilot-chat",
    highlights: [
      "Exam question quality & repetition checks",
      "Multi-grader consistency analysis",
      "Unbiased grade dispute advisory",
    ],
  },
  student: {
    key: "student",
    dbRole: "student",
    label: "Student",
    noun: "student account",
    description:
      "Submit regrade requests, track dispute status, and review transparent AI-assisted evaluations.",
    icon: Users,
    accentText: "text-secondary",
    accentBg: "bg-secondary/10 border-secondary/20",
    accentRing: "focus-visible:ring-secondary",
    allowSignup: true,
    landingHref: "/dashboard/student",
    highlights: [
      "File and track regrade petitions",
      "See rubric-based reasoning",
      "Transparent status updates",
    ],
  },
  admin: {
    key: "admin",
    dbRole: "admin",
    label: "Admin",
    noun: "administrator account",
    description:
      "Oversee departments, manage faculty access, and monitor academic integrity across the institution.",
    icon: ShieldCheck,
    accentText: "text-accent",
    accentBg: "bg-accent/10 border-accent/20",
    accentRing: "focus-visible:ring-accent",
    allowSignup: false,
    landingHref: "/",
    highlights: [
      "Institution-wide oversight",
      "Faculty & course management",
      "Integrity audit monitoring",
    ],
  },
};

export const ROLE_KEYS = Object.keys(ROLES) as RoleKey[];

export function isRoleKey(value: string): value is RoleKey {
  return value in ROLES;
}
