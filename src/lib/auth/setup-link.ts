import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Resolves the public base URL used for email verification redirects. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Generates a single-use Supabase action link that verifies the user's email,
 * establishes a session, and redirects to the password-setup page.
 * Returns null if generation fails (caller can fall back gracefully).
 */
export async function generateAccountSetupLink(
  email: string
): Promise<string | null> {
  const admin = createAdminClient();
  const redirectTo = `${getSiteUrl()}/auth/set-password`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) return null;
  return data.properties.action_link;
}
