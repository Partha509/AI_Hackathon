# FacultyOS — Progress Log

Update this file **immediately after finishing each task** in [TASKS.md](TASKS.md). One line per task under your track. Keep entries factual: what shipped, how it was verified, what's next.

Format: `- [x] **T<id>** — <one-line summary> · verified: <how> · <commit hash or "uncommitted">`

## Status board

| Task | Owner | Status | Notes |
|---|---|---|---|
| T0 Shared contract | P3 | ⬜ not started | Blocks T1.2–T1.5, T2.3, T3.1 |
| T1.1 shadcn primitives | P1 | ⬜ | |
| T1.2 Exam Quality UI | P1 | ⬜ | |
| T1.3 Grading Consistency UI | P1 | ⬜ | |
| T1.4 Grade Disputes UI | P1 | ⬜ | |
| T1.5 Chat UI | P1 | ⬜ | |
| T1.6 Dashboard + a11y | P1 | ⬜ | |
| T2.1 Supabase schema + seed | P2 | ⬜ | |
| T2.2 Supabase clients | P2 | ⬜ | |
| T2.3 DB layer | P2 | ⬜ | |
| T2.4 Data API routes | P2 | ⬜ | |
| T2.5 Deploy | P2 | ⬜ | |
| T2.6 Tier-2 data (stretch) | P2 | ⬜ | |
| T3.1 Gemini client | P3 | ⬜ | |
| T3.2 Exam Quality skill | P3 | ⬜ | |
| T3.3 Consistency skill | P3 | ⬜ | |
| T3.4 Dispute skill | P3 | ⬜ | |
| T3.5 Chat orchestration | P3 | ⬜ | |
| T3.6 Tests | P3 | ⬜ | |
| T4.1 Integration | All | ⬜ | GO/NO-GO gate |
| T4.2 Demo hardening | P1+P2 | ⬜ | |
| T4.3 Tier-2 skills (stretch) | P3 | ⬜ | |

Legend: ⬜ not started · 🟨 in progress · ✅ done · ❌ blocked (say by what)

## Setup (done)
- [x] **Setup** — `npm install` (110 packages), `npm run dev` serves http://localhost:3000, `/` returns 200 · verified: wget · uncommitted

## P1 — UI
<!-- append here -->

## Auth (Supabase)
- [x] **Supabase Auth wired** — browser/server/admin/middleware clients, `signInWithPassword` + `signUp` in AuthForm with role enforcement, route guard middleware on the 4 feature routes, Sign In/Sign Out in Navbar, `supabase/auth.sql` profile trigger, `scripts/seed-admin.mjs` (`npm run seed:admin`). teacher→`faculty` role mapping. · verified: `npm run build` passes · uncommitted
- [x] **Auth E2E tested (all 3 roles)** — teacher/student signup via `POST /api/auth/signup` (service-role: creates confirmed user + `profiles` row), login + RLS role check, admin login, and cross-role rejection all pass. Data verified in `profiles` table. Test: `node --env-file=.env.local scripts/test-auth.mjs`. · uncommitted
- [x] **Role-based access control** — `src/lib/access-control.ts` maps routes→roles per the EduTrack matrix (admin: all; faculty: exam-quality/grading-consistency/grade-disputes/copilot-chat; student: grade-disputes only). Enforced server-side in `src/middleware.ts` (role check, not just session) and reflected in Navbar (links filtered by role). Fixed: middleware must live at `src/middleware.ts` (src-dir project), not repo root. Verified via browser E2E for student/teacher/admin/logged-out. · `npm run build` shows `ƒ Middleware` · uncommitted

## P2 — Supabase & backend
<!-- append here; include row counts / sample API output -->

## P3 — AI & QA
<!-- append here; include sample skill output for script-001 / req-101 -->

## Integration bugs (T4.1)
| # | Symptom | Owner | Status |
|---|---|---|---|
| | | | |

## Deploy
- Preview URL:
- Production URL:
