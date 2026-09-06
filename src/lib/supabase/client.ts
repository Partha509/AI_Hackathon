import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
