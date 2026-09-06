import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/** Returns the authenticated user's profile, or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  // Prefer getUser (verified). Fall back to the local session if a transient
  // token refresh makes getUser momentarily return null.
  let userId: string | undefined;
  const { data: userData } = await supabase.auth.getUser();
  userId = userData.user?.id;
  if (!userId) {
    const { data: sessionData } = await supabase.auth.getSession();
    userId = sessionData.session?.user?.id;
  }
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return (data as Profile) ?? null;
}
