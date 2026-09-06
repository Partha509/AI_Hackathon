// Creates a demo student whose name matches the seeded answer scripts,
// plus a second graded script (no appeal yet) to demo the regrade flow.
// Run with: npm run seed:student
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = process.env.SEED_STUDENT_EMAIL || "student@facultyos.edu";
const password = process.env.SEED_STUDENT_PASSWORD || "Student@12345";
// Must match answer_scripts.student_name so grades resolve to this student.
const fullName = process.env.SEED_STUDENT_NAME || "Sabbir Ahmed";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / service key in .env.");
  process.exit(1);
}

const s = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target) {
  let page = 1;
  for (;;) {
    const { data, error } = await s.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email === target);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  // 1. Auth user + profile
  const existing = await findUserByEmail(email);
  let userId;
  if (existing) {
    const { data, error } = await s.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Updated student auth user:", email);
  } else {
    const { data, error } = await s.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Created student auth user:", email);
  }

  const { error: pErr } = await s
    .from("profiles")
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role: "student",
      department: "CSE",
      student_id: process.env.SEED_STUDENT_ID || "21.01.04.099",
      current_semester: process.env.SEED_STUDENT_SEMESTER || "3.2",
      must_change_password: false,
      is_active: true,
    });
  if (pErr) throw pErr;

  // 2. A second graded script for the same student (script-001 already exists
  //    with an appeal; this one is appeal-free so the regrade flow is demoable).
  const scriptId = "script-sabbir-mst";
  const { error: scErr } = await s.from("answer_scripts").upsert({
    id: scriptId,
    exam_id: "exam-cse321-s25",
    student_name: fullName,
    student_id_number: "21.01.04.099",
    question_number: 1,
    question_text:
      "In an undirected weighted graph where all edge costs are strictly unique, prove whether there can exist more than one distinct Minimum Spanning Tree. Justify using the Cut Property.",
    student_answer:
      "Assume two distinct MSTs T1 and T2. Take the minimum-weight edge e in their symmetric difference. Using the Cut Property, e must belong to every MST, contradicting that it is missing from one. Hence with unique weights the MST is unique.",
    rubric_guidelines:
      "Total Marks: 15.\n- Correct assumption/setup for contradiction: 5\n- Correct application of the Cut Property: 6\n- Valid conclusion of uniqueness: 4",
  });
  if (scErr) throw scErr;

  // Refresh this script's grades idempotently.
  await s.from("grades").delete().eq("script_id", scriptId);
  const { error: gErr } = await s.from("grades").insert([
    {
      script_id: scriptId,
      grader_name: "Dr. Tanvir Rahman",
      grader_role: "Head Grader",
      score_awarded: 13,
      max_score: 15,
      feedback: "Clear contradiction argument and correct use of the Cut Property. Minor gaps in formalism.",
    },
    {
      script_id: scriptId,
      grader_name: "Lecturer Hasan Mahmud",
      grader_role: "Co-Examiner",
      score_awarded: 12,
      max_score: 15,
      feedback: "Solid proof; conclusion could be stated more rigorously.",
    },
  ]);
  if (gErr) throw gErr;

  console.log("Seeded extra graded script:", scriptId);
  console.log("\n✅ Student ready. Sign in at /auth/student/login");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
