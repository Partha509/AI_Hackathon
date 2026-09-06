import type { DbRole } from "./auth-roles";

/**
 * Role-based access for feature routes, per the EduTrack feature matrix:
 *  - admin: oversight across everything
 *  - faculty (teacher): exam quality, grading consistency, dispute resolution, co-pilot
 *  - student: grade disputes only (submit/track)
 */
export const ROUTE_ACCESS: { prefix: string; roles: DbRole[] }[] = [
  { prefix: "/dashboard/faculty", roles: ["admin", "faculty"] },
  { prefix: "/exam-quality", roles: ["admin", "faculty"] },
  { prefix: "/grading-consistency", roles: ["admin", "faculty"] },
  { prefix: "/grade-disputes", roles: ["admin", "faculty", "student"] },
  { prefix: "/copilot-chat", roles: ["admin", "faculty"] },
  // Faculty must never reach student evaluation records.
  { prefix: "/evaluations", roles: ["admin", "student"] },
];

/** Where each role lands after login (and where forbidden access is redirected). */
export const ROLE_HOME: Record<DbRole, string> = {
  admin: "/",
  faculty: "/copilot-chat",
  student: "/grade-disputes",
};

/** Returns the allowed roles for a path, or null if the path isn't access-controlled. */
export function allowedRolesForPath(pathname: string): DbRole[] | null {
  const match = ROUTE_ACCESS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  return match ? match.roles : null;
}

export function canAccess(role: DbRole | null, pathname: string): boolean {
  const allowed = allowedRolesForPath(pathname);
  if (!allowed) return true; // not a controlled feature route
  if (!role) return false;
  return allowed.includes(role);
}
