// Schema-adaptive demo seed for the CURRENT live schema
// (profiles: student_id_number, current_semester; course_applications).
// Safe/idempotent: checks existence before inserting. Run:
//   node --env-file=.env scripts/seed-basic.mjs
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / service key in .env.");
  process.exit(1);
}
const s = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const COURSES = [
  { id: "cse-321", code: "CSE 321", title: "Algorithms", faculty_name: "Dr. Tanvir Rahman" },
  { id: "cse-3201", code: "CSE 3201", title: "Database Systems", faculty_name: "Dr. Tanvir Rahman" },
  { id: "cse-2103", code: "CSE 2103", title: "Data Structures", faculty_name: "Lecturer Hasan Mahmud" },
  { id: "eee-1101", code: "EEE 1101", title: "Basic Electrical Engineering", faculty_name: "Dr. Ayesha Siddiqua" },
  { id: "hum-2201", code: "HUM 2201", title: "Engineering Economics", faculty_name: "Dr. Nusrat Jahan" },
];

const STUDENTS = [
  ["Rakib Hasan", "rakib.demo@aust.edu", "21.01.04.001", "3.2"],
  ["Tania Sultana", "tania.demo@aust.edu", "21.01.04.010", "3.2"],
  ["Imran Kabir", "imran.demo@aust.edu", "21.01.04.021", "2.2"],
  ["Nadia Islam", "nadia.demo@aust.edu", "21.01.04.033", "3.1"],
];

async function upsertProfile(row) {
  const { error } = await s.from("profiles").upsert(row, { onConflict: "email" });
  if (error) throw new Error(`profile ${row.email}: ${error.message}`);
}

async function idByEmail(email) {
  const { data } = await s.from("profiles").select("id").eq("email", email).single();
  return data?.id ?? null;
}

async function enroll(studentId, courseId, status) {
  const { data: existing } = await s
    .from("course_applications")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) return false;
  const { error } = await s
    .from("course_applications")
    .insert({ student_id: studentId, course_id: courseId, status });
  if (error) throw new Error(`enroll ${courseId}: ${error.message}`);
  return true;
}

async function main() {
  // 1. Courses
  for (const c of COURSES) {
    const { error } = await s
      .from("courses")
      .upsert({ ...c, learning_objectives: [] }, { onConflict: "id" });
    if (error) throw new Error(`course ${c.code}: ${error.message}`);
  }
  console.log(`Courses upserted: ${COURSES.length}`);

  // 2. Demo student profiles (data-only)
  for (const [full_name, email, student_id_number, current_semester] of STUDENTS) {
    await upsertProfile({
      id: randomUUID(),
      email,
      full_name,
      role: "student",
      department: "CSE",
      student_id_number,
      current_semester,
    });
  }
  console.log(`Student profiles upserted: ${STUDENTS.length}`);

  // 3. Ensure the login student is complete (omit student_id_number to avoid
  // colliding with the pre-seeded Sabbir profile that already holds 21.01.04.099).
  await upsertProfile({
    email: "student@facultyos.edu",
    full_name: "Sabbir Ahmed",
    role: "student",
    department: "CSE",
    current_semester: "3.2",
  });

  // 4. Enrollments (course_applications)
  const plan = [
    ["student@facultyos.edu", "cse-321", "approved"],
    ["student@facultyos.edu", "cse-3201", "pending"],
    ["rakib.demo@aust.edu", "cse-321", "approved"],
    ["tania.demo@aust.edu", "cse-321", "pending"],
    ["imran.demo@aust.edu", "cse-2103", "approved"],
    ["nadia.demo@aust.edu", "cse-3201", "approved"],
  ];
  let count = 0;
  for (const [email, courseId, status] of plan) {
    const id = await idByEmail(email);
    if (id && (await enroll(id, courseId, status))) count++;
  }
  console.log(`Enrollments inserted: ${count}`);

  console.log("\n✅ Basic demo data seeded for the current schema.");
  console.log("   Login student: student@facultyos.edu / Student@12345");
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
