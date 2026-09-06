# FacultyOS — Known Limitations

Record anything you consciously skipped, faked, hard-coded, or that only works under demo conditions. Judges respect honesty; teammates need to know what not to rely on.

Format: `- **[T<id> · P<n>]** <limitation> — <impact> — <fix if we had time>`

## Known before starting
- **[Repo · all]** No authentication. `profiles` table exists but nothing writes to it; RLS is opened to `anon` for the hackathon (T2.1). — Anyone with the anon key can read all academic data. — Add Supabase Auth + role-based RLS.
- **[Repo · P2]** Original seed inserts `'req-101'` into a `UUID` column and lacks `ON CONFLICT` guards on several tables (re-running fails). — Fixed in T2.1 by switching `grade_requests.id` to `TEXT` and making the seed idempotent.
- **[Repo · P3]** LLM output is non-deterministic; similarity scores and suggested grades can vary run to run. — Demo numbers may differ from screenshots. — Pin `temperature: 0`, cache results per input hash in `chat_logs`.
- **[Repo · P3]** "Semantic repetition" is judged by the LLM, not by an embedding index. — Scales poorly beyond a few dozen past questions per course. — Use `pgvector` + Gemini embeddings.
- **[Repo · all]** Single course (CSE 321) with ~2 scripts and ~2 disputes in seed data. — Every demo path leads to the same records. — T2.1/T4.2 add more.
- **[Repo · all]** `npm audit` reports 2 vulnerabilities (1 moderate, 1 high) in transitive deps. — Not addressed during hackathon.
- **[Repo · P1]** Dev server logs `Retrying 1/3…` from Next.js font/asset fetches when offline. — Cosmetic.

## P1 — UI
<!-- append here -->

## P2 — Supabase & backend
<!-- append here -->

## P3 — AI & QA
<!-- append here -->

## Discovered during integration (T4.1)
<!-- append here -->
