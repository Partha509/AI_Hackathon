// Creates (or updates) a demo faculty login that owns the seeded CSE 321 course.
// full_name matches courses.faculty_name so the portfolio resolves via name match.
// Run with: node --env-file=.env scripts/seed-teacher.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = process.env.SEED_TEACHER_EMAIL || "teacher@facultyos.edu";
const password = process.env.SEED_TEACHER_PASSWORD || "Teacher@12345";
const fullName = process.env.SEED_TEACHER_NAME || "Dr. Tanvir Rahman";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and a service/secret key in .env.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email === target);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

const existing = await findUserByEmail(email);
let userId;
if (existing) {
  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "faculty" },
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Updated existing teacher: ${email}`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "faculty" },
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created teacher: ${email}`);
}

const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  email,
  full_name: fullName,
  role: "faculty",
  department: "CSE",
});
if (profileError) throw profileError;

console.log("\n✅ Teacher ready. Sign in at /auth/teacher/login");
console.log(`   Email:    ${email}`);
console.log(`   Password: ${password}`);
console.log(`   Name:     ${fullName} (matches CSE 321 faculty_name → portfolio resolves)`);
