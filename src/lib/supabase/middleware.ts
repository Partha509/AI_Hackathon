import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { allowedRolesForPath, ROLE_HOME } from "@/lib/access-control";
import type { DbRole } from "@/lib/auth-roles";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

// Feature tools that require an authenticated session.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/exam-quality",
  "/grading-consistency",
  "/grade-disputes",
  "/copilot-chat",
  "/evaluations",
];

const SET_PASSWORD_PATH = "/auth/set-password";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If Supabase isn't configured yet, don't block the app.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response;
  }

  // API routes authenticate themselves. Skipping here avoids a token-refresh
  // race where middleware rotates the cookie and the route reads the stale one.
  if (request.nextUrl.pathname.startsWith("/api")) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access + invite completion gate for signed-in users.
  const allowed = allowedRolesForPath(pathname);
  if (user) {
    // select("*") tolerates optional columns (e.g. must_change_password) that may
    // not exist until the admin/student migration is applied — avoids locking out auth.
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Force invited users to set a password before using the app.
    if (profile?.must_change_password && pathname !== SET_PASSWORD_PATH) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = SET_PASSWORD_PATH;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    const role = profile?.role as DbRole | undefined;
    if (allowed && (!role || !allowed.includes(role))) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role ? ROLE_HOME[role] : "/auth";
      redirectUrl.search = "";
      if (!role) redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
