// Temporary end-to-end auth test. Mirrors the browser AuthForm flow
// (anon client for signUp/signIn) and inspects tables via the service key.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const pub = createClient(url, anon, { auth: { persistSession: false } });
const admin = createClient(url, secret, { auth: { persistSession: false } });

const stamp = Date.now();
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const cases = [
  { role: "teacher", dbRole: "faculty", email: `t.teacher.${stamp}@aust.edu`, name: "Test Teacher" },
  { role: "student", dbRole: "student", email: `t.student.${stamp}@aust.edu`, name: "Test Student" },
];
const PASSWORD = "Test@12345";
const createdUserIds = [];

function line() {
  console.log("─".repeat(60));
}

async function getProfile(userId) {
  const { data } = await admin
    .from("profiles")
    .select("email,role,full_name")
    .eq("id", userId)
    .single();
  return data;
}

async function testSignup(c) {
  console.log(`\n[${c.role.toUpperCase()}] SIGNUP via /api/auth/signup as ${c.email}`);
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: c.email,
      password: PASSWORD,
      fullName: c.name,
      role: c.dbRole,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    console.log("  ✗ signup route error:", json.error);
    return null;
  }
  const userId = json.data.id;
  createdUserIds.push(userId);
  console.log("  ✓ auth user + confirmed created:", userId);

  const profile = await getProfile(userId);
  if (!profile) {
    console.log("  ✗ NO profile row created");
  } else {
    const ok = profile.role === c.dbRole;
    console.log(`  ${ok ? "✓" : "✗"} profile row: role=${profile.role} expected=${c.dbRole}, name=${profile.full_name}`);
  }
  return userId;
}

async function testLogin(c) {
  console.log(`\n[${c.role.toUpperCase()}] LOGIN as ${c.email}`);
  const { data, error } = await pub.auth.signInWithPassword({
    email: c.email,
    password: PASSWORD,
  });
  if (error) {
    console.log("  ✗ login error:", error.message);
    return;
  }
  console.log("  ✓ signInWithPassword OK");
  // Role enforcement check (same query AuthForm runs, under the user's RLS context).
  const authed = createClient(url, anon, { auth: { persistSession: false } });
  await authed.auth.setSession(data.session);
  const { data: profile } = await authed
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  const ok = profile?.role === c.dbRole;
  console.log(`  ${ok ? "✓" : "✗"} role check via RLS: got=${profile?.role} expected=${c.dbRole}`);
  await pub.auth.signOut();
}

async function testAdminLogin() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@facultyos.edu";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  console.log(`\n[ADMIN] LOGIN as ${email}`);
  const { data, error } = await pub.auth.signInWithPassword({ email, password });
  if (error) {
    console.log("  ✗ login error:", error.message);
    return;
  }
  const profile = await getProfile(data.user.id);
  const ok = profile?.role === "admin";
  console.log(`  ✓ login OK`);
  console.log(`  ${ok ? "✓" : "✗"} profile role=${profile?.role} expected=admin`);
  await pub.auth.signOut();
}

async function cleanup() {
  console.log("\nCleanup: removing test users…");
  for (const id of createdUserIds) {
    await admin.from("profiles").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id);
  }
  console.log(`  removed ${createdUserIds.length} test user(s).`);
}

async function main() {
  line();
  console.log("AUTH E2E TEST —", url);
  line();

  for (const c of cases) await testSignup(c);
  for (const c of cases) await testLogin(c);
  await testAdminLogin();

  // Negative: a teacher account must be rejected on the admin/student role check.
  console.log(`\n[NEGATIVE] teacher account evaluated against 'admin' role`);
  {
    const teacher = cases[0];
    const { data } = await pub.auth.signInWithPassword({ email: teacher.email, password: PASSWORD });
    const authed = createClient(url, anon, { auth: { persistSession: false } });
    await authed.auth.setSession(data.session);
    const { data: profile } = await authed.from("profiles").select("role").eq("id", data.user.id).single();
    const rejected = profile?.role !== "admin";
    console.log(`  ${rejected ? "✓" : "✗"} correctly ${rejected ? "REJECTED" : "ACCEPTED"} (role=${profile?.role})`);
    await pub.auth.signOut();
  }

  line();
  console.log("Final table snapshot (profiles):");
  const { data } = await admin.from("profiles").select("email,role").order("role");
  console.table(data);
  line();

  await cleanup();
}

main().catch((e) => {
  console.error("TEST CRASHED:", e.message ?? e);
  process.exit(1);
});
