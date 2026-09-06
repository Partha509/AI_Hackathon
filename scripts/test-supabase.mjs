import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Connecting to Supabase URL:", url);

if (!url || !key) {
  console.error("Missing SUPABASE_URL or keys in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkTables() {
  const tables = [
    "profiles",
    "courses",
    "course_enrollments",
    "syllabi",
    "exams",
    "exam_questions",
    "answer_scripts",
    "grades",
    "grade_requests",
    "chat_logs"
  ];
  console.log("\n--- Checking Supabase Tables ---");

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(3);
    if (error) {
      console.log(`❌ Table [${table}]: ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`✅ Table [${table}]: OK (${data?.length || 0} rows found)`);
    }
  }
}

checkTables().catch(console.error);
