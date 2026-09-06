// Seeds previous-year SHORT questions into course_questions, and ensures a
// faculty login account exists for testing. Idempotent. Run: npm run seed:questions
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / service key in .env.");
  process.exit(1);
}
const s = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Previous-year short questions per course id.
const BANK = {
  "cse-3201": {
    session: "Fall-24",
    topicDefault: "Databases",
    questions: [
      ["Define a primary key and explain how it differs from a candidate key.", "Keys"],
      ["What is normalization? Name the first three normal forms.", "Normalization"],
      ["Write the SQL to select all students enrolled after 2023 from an ENROLLMENT table.", "SQL"],
      ["Differentiate between DELETE and TRUNCATE.", "SQL"],
      ["What is a transaction? State the ACID properties.", "Transactions"],
      ["Explain the difference between a clustered and a non-clustered index.", "Indexing"],
    ],
  },
  "cse-3117": {
    session: "Fall-24",
    topicDefault: "Algorithms",
    questions: [
      ["State the time complexity of binary search and justify it.", "Complexity"],
      ["Define a greedy algorithm and give one example.", "Greedy"],
      ["What is the difference between BFS and DFS traversal?", "Graphs"],
      ["Write the recurrence relation for merge sort.", "Divide & Conquer"],
      ["Explain the optimal substructure property with an example.", "Dynamic Programming"],
    ],
  },
  "cse-2103": {
    session: "Spring-24",
    topicDefault: "Data Structures",
    questions: [
      ["Compare an array and a linked list in terms of access time.", "Lists"],
      ["What is a stack? Give two real-world applications.", "Stacks"],
      ["Define a binary search tree and its ordering property.", "Trees"],
      ["What is the difference between a queue and a priority queue?", "Queues"],
      ["State the worst-case time complexity of inserting into a hash table.", "Hashing"],
    ],
  },
  "eee-3205": {
    session: "Fall-24",
    topicDefault: "DSP",
    questions: [
      ["Define the sampling theorem.", "Sampling"],
      ["What is aliasing and how is it prevented?", "Sampling"],
      ["State the difference between FIR and IIR filters.", "Filters"],
      ["Define the z-transform of a discrete signal.", "Transforms"],
    ],
  },
};

async function seedFacultyLogin() {
  const email = process.env.SEED_FACULTY_EMAIL || "faculty@facultyos.edu";
  const password = process.env.SEED_FACULTY_PASSWORD || "Faculty@12345";
  const fullName = process.env.SEED_FACULTY_NAME || "Dr. Tanvir Rahman";

  // Find or create the auth user.
  let userId;
  let page = 1;
  for (;;) {
    const { data } = await s.auth.admin.listUsers({ page, perPage: 200 });
    const match = data.users.find((u) => u.email === email);
    if (match) { userId = match.id; break; }
    if (data.users.length < 200) break;
    page += 1;
  }
  if (userId) {
    await s.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "faculty" },
    });
  } else {
    const { data, error } = await s.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: fullName, role: "faculty" },
    });
    if (error) throw error;
    userId = data.user.id;
  }
  await s.from("profiles").upsert({
    id: userId, email, full_name: fullName, role: "faculty",
    department: "CSE", is_active: true, must_change_password: false,
  });
  return { email, password };
}

async function main() {
  // Ensure the guard columns exist.
  const check = await s.from("course_questions").select("id").limit(1);
  if (check.error) {
    console.error("course_questions table missing — run: npm run migrate supabase/course_questions.sql");
    process.exit(1);
  }

  let total = 0;
  for (const [courseId, spec] of Object.entries(BANK)) {
    const { data: course } = await s.from("courses").select("id, code").eq("id", courseId).maybeSingle();
    if (!course) { console.log(`skip ${courseId} (course not found)`); continue; }

    // Idempotent: clear previous seeded questions for this course, then insert.
    await s.from("course_questions").delete().eq("course_id", courseId).eq("is_previous", true);
    const rows = spec.questions.map(([text, topic]) => ({
      course_id: courseId,
      question_text: text,
      topic: topic ?? spec.topicDefault,
      marks: 5,
      source: "manual",
      is_previous: true,
      session: spec.session,
    }));
    const { error } = await s.from("course_questions").insert(rows);
    if (error) throw error;
    total += rows.length;
    console.log(`${course.code}: ${rows.length} previous questions`);
  }

  const faculty = await seedFacultyLogin();

  console.log(`\n✅ Seeded ${total} previous short questions.`);
  console.log(`Faculty login: ${faculty.email} / ${faculty.password}`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
