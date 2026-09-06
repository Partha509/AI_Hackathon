// Runs a SQL migration file against the database using DATABASE_URL.
// Usage: node --env-file=.env scripts/migrate.mjs supabase/admin_student_system.sql
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2] || "supabase/admin_student_system.sql";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "\nMissing DATABASE_URL in .env.\n" +
      "Get it from Supabase → Project Settings → Database → Connection string → URI\n" +
      "(use the connection string that includes your database password).\n"
  );
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✅ Applied migration: ${file}`);
} catch (err) {
  console.error(`✗ Migration failed (${file}):`, err.message);
  process.exit(1);
} finally {
  await client.end();
}
