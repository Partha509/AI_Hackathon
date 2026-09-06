import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Server-side client for feature API routes. Prefers the service-role key
 * (bypasses RLS) and falls back to the anon key, which works while the
 * hackathon RLS policies remain open.
 */
export function createApiClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    SUPABASE_ANON_KEY;

  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
