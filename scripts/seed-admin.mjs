// Creates (or updates) the FacultyOS admin account.
// Run with: npm run seed:admin  (loads .env.local via --env-file)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL || "admin@facultyos.edu";
const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const fullName = process.env.SEED_ADMIN_NAME || "System Administrator";

if (!url || !serviceKey) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  // Paginate through users to find an existing account with this email.
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((u) => u.email === targetEmail);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  const existing = await findUserByEmail(email);
  let userId;

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "admin" },
      }
    );
    if (error) throw error;
    userId = data.user.id;
    console.log(`Updated existing admin: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "admin" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created admin: ${email}`);
  }

  // Ensure the profile row exists with the admin role (trigger also covers new users).
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: "admin",
  });
  if (profileError) throw profileError;

  console.log("\n✅ Admin ready. Sign in at /auth/admin/login");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
