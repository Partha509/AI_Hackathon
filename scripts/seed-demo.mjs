// Seeds a realistic demo: departments' courses, teachers, students, and
// enrollments (course_applications). Idempotent. Requires admin_student_system.sql.
// Run with: npm run seed:demo
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / service key in .env.");
  process.exit(1);
}
const s = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function sem(code) {
  const d = (code.match(/\d/g) ?? []).join("");
  return `${d[0]}.${d[1]}`;
}

// ── Courses (code encodes dept + semester: first 2 digits = semester) ──
const COURSES = [
  { id: "cse-1101", code: "CSE 1101", title: "Structured Programming", faculty_name: "Ms. Farzana Akter" },
  { id: "ce-1103", code: "CE 1103", title: "Engineering Mechanics", faculty_name: "Dr. Selim Khan" },
  { id: "eee-1101", code: "EEE 1101", title: "Basic Electrical Engineering", faculty_name: "Dr. Ayesha Siddiqua" },
  { id: "cse-2103", code: "CSE 2103", title: "Data Structures", faculty_name: "Lecturer Hasan Mahmud" },
  { id: "me-2103", code: "ME 2103", title: "Thermodynamics", faculty_name: "Prof. Kamrul Islam" },
  { id: "hum-2201", code: "HUM 2201", title: "Engineering Economics", faculty_name: "Dr. Nusrat Jahan" },
  { id: "cse-3117", code: "CSE 3117", title: "Algorithms", faculty_name: "Dr. Tanvir Rahman" },
  { id: "cse-3201", code: "CSE 3201", title: "Database Systems", faculty_name: "Dr. Tanvir Rahman" },
  { id: "eee-3205", code: "EEE 3205", title: "Digital Signal Processing", faculty_name: "Dr. Ayesha Siddiqua" },
  { id: "bba-4101", code: "BBA 4101", title: "Principles of Marketing", faculty_name: "Mr. Rafiq Uddin" },
];

// ── Teachers (data-only faculty profiles) ──
const TEACHERS = [
  ["Dr. Tanvir Rahman", "tanvir.demo@aust.edu", "CSE"],
  ["Lecturer Hasan Mahmud", "hasan.demo@aust.edu", "CSE"],
  ["Ms. Farzana Akter", "farzana.demo@aust.edu", "CSE"],
  ["Dr. Ayesha Siddiqua", "ayesha.demo@aust.edu", "EEE"],
  ["Prof. Kamrul Islam", "kamrul.demo@aust.edu", "ME"],
  ["Dr. Nusrat Jahan", "nusrat.demo@aust.edu", "HUM"],
  ["Mr. Rafiq Uddin", "rafiq.demo@aust.edu", "BBA"],
  ["Dr. Selim Khan", "selim.demo@aust.edu", "CE"],
];

// ── Students (data-only, plus the login student reused separately) ──
const STUDENTS = [
  ["Rakib Hasan", "rakib.demo@aust.edu", "21.01.04.001", "1.1"],
  ["Tania Sultana", "tania.demo@aust.edu", "21.01.04.010", "2.1"],
  ["Imran Kabir", "imran.demo@aust.edu", "21.01.04.021", "2.2"],
  ["Nadia Islam", "nadia.demo@aust.edu", "21.01.04.033", "3.1"],
  ["Fahim Ahmed", "fahim.demo@aust.edu", "21.01.04.045", "3.2"],
  ["Sadia Rahman", "sadia.demo@aust.edu", "21.01.04.052", "3.2"],
  ["Arif Chowdhury", "arif.demo@aust.edu", "21.01.04.066", "4.1"],
];

async function guardSchema() {
  const p = await s.from("profiles").select("current_semester").limit(1);
  if (p.error) {
    console.error("\n✗ Schema not ready:", p.error.message);
    console.error("  Run supabase/admin_student_system.sql in the Supabase SQL Editor first.\n");
    process.exit(1);
  }
}

async function upsertProfileByEmail(row) {
  // profiles.email is unique — upsert on it.
  const { error } = await s.from("profiles").upsert(row, { onConflict: "email" });
  if (error) throw new Error(`profile ${row.email}: ${error.message}`);
}

async function getProfileIdByEmail(email) {
  const { data } = await s.from("profiles").select("id").eq("email", email).single();
  return data?.id ?? null;
}

async function enroll(studentId, courseId, status) {
  const { error } = await s
    .from("course_applications")
    .upsert({ student_id: studentId, course_id: courseId, status }, { onConflict: "student_id,course_id" });
  if (error) throw new Error(`enroll ${courseId}: ${error.message}`);
}

async function main() {
  await guardSchema();

  // 1. Courses
  for (const c of COURSES) {
    const { error } = await s.from("courses").upsert({ ...c, learning_objectives: [] }, { onConflict: "id" });
    if (error) throw new Error(`course ${c.code}: ${error.message}`);
  }
  console.log(`Courses upserted: ${COURSES.length}`);

  // 2. Teachers (faculty profiles, no auth login needed)
  for (const [full_name, email, department] of TEACHERS) {
    await upsertProfileByEmail({
      id: randomUUID(),
      email,
      full_name,
      role: "faculty",
      department,
      is_active: true,
      must_change_password: false,
    });
  }
  console.log(`Teachers upserted: ${TEACHERS.length}`);

  // 3. Students (data-only)
  for (const [full_name, email, student_id, current_semester] of STUDENTS) {
    await upsertProfileByEmail({
      id: randomUUID(),
      email,
      full_name,
      role: "student",
      department: "CSE",
      student_id,
      current_semester,
      is_active: true,
      must_change_password: false,
    });
  }
  console.log(`Students upserted: ${STUDENTS.length}`);

  // 4. Login student (existing auth account) → semester 3.2
  await upsertProfileByEmail({
    email: "student@facultyos.edu",
    full_name: "Sabbir Ahmed",
    role: "student",
    department: "CSE",
    student_id: "21.01.04.099",
    current_semester: "3.2",
    is_active: true,
    must_change_password: false,
  });

  // 5. Enrollments — each student into courses matching their semester.
  const courseBySem = new Map();
  for (const c of COURSES) {
    const key = sem(c.code);
    if (!courseBySem.has(key)) courseBySem.set(key, []);
    courseBySem.get(key).push(c.id);
  }

  const allStudents = [...STUDENTS.map((x) => x[1]), "student@facultyos.edu"];
  let enrollments = 0;
  for (const email of allStudents) {
    const id = await getProfileIdByEmail(email);
    if (!id) continue;
    const { data: prof } = await s.from("profiles").select("current_semester").eq("id", id).single();
    const courses = courseBySem.get(prof?.current_semester) ?? [];
    // Approve the first matching course, mark a second as pending.
    if (courses[0]) {
      await enroll(id, courses[0], "approved");
      enrollments++;
    }
    if (courses[1]) {
      await enroll(id, courses[1], "pending");
      enrollments++;
    }
  }
  console.log(`Enrollments (course_applications) upserted: ${enrollments}`);

  console.log("\n✅ Demo data seeded. Log in as student@facultyos.edu / Student@12345 (semester 3.2).");
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
