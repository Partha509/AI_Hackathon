# EduTrack Feature Reference — Next.js + Supabase Edition

A knowledge-transfer reference for rebuilding EduTrack's core features (roles, courses, automatic grading, enrollment, grade recheck, and the At-Risk early-warning system) in a new stack: **Next.js (React) + Supabase (Postgres/Auth/RLS) + Tailwind CSS + shadcn/ui**.

---

## Stack Mapping (ASP.NET → New Stack)

| EduTrack (old) | Your new project |
|---|---|
| ASP.NET Core Identity | **Supabase Auth** (`auth.users`) + `profiles` table |
| EF Core entities | **Postgres tables** (SQL DDL) |
| `IdentityDbContext` | Supabase Postgres schema |
| `[Authorize(Roles=...)]` | **Row Level Security (RLS)** policies + Next.js middleware |
| Services (GradeCalculator, AtRisk) | Postgres functions/triggers **or** Next.js Server Actions / Route Handlers |
| Custom middleware (IsActive, MustChangePassword) | RLS + `middleware.ts` route guards |
| Razor Views | React Server/Client Components + shadcn/ui + Tailwind |
| `decimal(p,s)` | `numeric(p,s)` |

---

## 1. Roles

Three roles: **admin, teacher, student**. Store the role on a `profiles` row (1:1 with `auth.users`). Enforce via RLS + a Next.js middleware that redirects based on role.

```sql
create type user_role as enum ('admin', 'teacher', 'student');
create type risk_level as enum ('High', 'Medium', 'Normal');
create type risk_type  as enum ('Academic', 'Attendance', 'Both', 'None');
create type recheck_status as enum ('Pending', 'Approved', 'Rejected');
```

---

## 2. Database Schema (Postgres / Supabase)

```sql
-- Mirrors ApplicationUser custom fields; 1:1 with Supabase auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) <= 100),
  role user_role not null default 'student',
  is_active boolean not null default true,          -- disable login
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

create table teachers (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  full_name text not null,
  employee_id text not null unique,
  email text not null unique,
  department text not null,
  designation text,
  is_active boolean not null default true
);

create table students (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  full_name text not null,
  roll_number text not null unique,
  email text not null unique,
  department text not null,
  enrollment_year int not null default extract(year from now())
    check (enrollment_year between 2000 and 2100),
  semester text,
  is_active boolean not null default true
);

create table courses (
  id bigint generated always as identity primary key,
  course_code text not null unique,
  course_name text not null,
  credit_hours numeric(3,1) not null check (credit_hours between 0.5 and 6),
  semester text,
  teacher_id bigint references teachers(id) on delete set null,
  is_active boolean not null default true
);

create table enrollments (
  id bigint generated always as identity primary key,
  student_id bigint not null references students(id) on delete cascade,
  course_id  bigint not null references courses(id)  on delete cascade,
  semester text,
  academic_year int not null default extract(year from now()),
  enrolled_on timestamptz not null default now(),
  is_active boolean not null default true,
  unique (student_id, course_id)              -- no duplicate enrollments
);

create table grades (
  id bigint generated always as identity primary key,
  enrollment_id bigint not null unique references enrollments(id) on delete cascade,
  assignment_mark numeric(5,2) not null default 0 check (assignment_mark between 0 and 20),
  attendance_mark numeric(5,2) not null default 0 check (attendance_mark between 0 and 10),
  midterm_mark    numeric(5,2) not null default 0 check (midterm_mark   between 0 and 20),
  final_mark      numeric(5,2) not null default 0 check (final_mark     between 0 and 50),
  total_mark  numeric(5,2) not null default 0,     -- computed
  letter_grade text,                               -- computed, e.g. 'A+'
  grade_point numeric(3,2) not null default 0,     -- computed GPA points
  updated_at timestamptz not null default now()
);

create table recheck_requests (
  id bigint generated always as identity primary key,
  student_id bigint not null references students(id) on delete restrict,
  teacher_id bigint not null references teachers(id) on delete restrict,
  grade_id   bigint not null references grades(id)   on delete restrict,
  status recheck_status not null default 'Pending',
  teacher_comment text check (char_length(teacher_comment) <= 500),
  request_date timestamptz not null default now()
);

create table at_risk_flags (
  id bigint generated always as identity primary key,
  student_id bigint not null references students(id) on delete cascade,
  running_gpa numeric(3,2) not null default 0,
  attendance_percent numeric(5,2) not null default 0,
  risk_level risk_level not null default 'Normal',
  risk_type  risk_type  not null default 'None',
  reason text,
  semester text,
  evaluated_at timestamptz not null default now()
);
```

**Relationships:** teacher 1─* course 1─* enrollment 1─1 grade 1─* recheck_request; student 1─* enrollment / recheck_request / at_risk_flag.

### Attribute notes (from original EduTrack)

- **profiles** — extends Supabase auth: `full_name`, `role`, `is_active` (login toggle), `must_change_password` (force first-login change), `created_at`.
- **students** — `roll_number` and `email` are unique; `enrollment_year` 2000–2100; optional `semester`.
- **teachers** — `employee_id` and `email` are unique; optional `designation`.
- **courses** — `course_code` unique; `credit_hours` 0.5–6 (precision 3,1); `teacher_id` nullable (set null when teacher removed).
- **enrollments** — composite unique `(student_id, course_id)` prevents duplicate enrollments.
- **grades** — one row per enrollment (`enrollment_id` unique); component marks capped (20/10/20/50); `total_mark`, `letter_grade`, `grade_point` are computed.
- **recheck_requests** — restrict delete on student/teacher/grade to preserve the audit trail.
- **at_risk_flags** — historical snapshot of each risk evaluation per student.

---

## 3. Automatic Grading System

`total = assignment + attendance + midterm + final` (max 100), then map:

| Total ≥ | Letter | GPA |
|---|---|---|
| 80 | A+ | 4.00 |
| 75 | A | 3.75 |
| 70 | A- | 3.50 |
| 65 | B+ | 3.25 |
| 60 | B | 3.00 |
| 55 | B- | 2.75 |
| 50 | C+ | 2.50 |
| 45 | C | 2.25 |
| 40 | D | 2.00 |
| <40 | F | 0.00 |

Implement as a **Postgres trigger** so grades auto-compute on insert/update (recommended), or in a Server Action:

```sql
create or replace function compute_grade() returns trigger as $$
begin
  new.total_mark := new.assignment_mark + new.attendance_mark
                  + new.midterm_mark + new.final_mark;
  if    new.total_mark >= 80 then new.letter_grade := 'A+'; new.grade_point := 4.00;
  elsif new.total_mark >= 75 then new.letter_grade := 'A';  new.grade_point := 3.75;
  elsif new.total_mark >= 70 then new.letter_grade := 'A-'; new.grade_point := 3.50;
  elsif new.total_mark >= 65 then new.letter_grade := 'B+'; new.grade_point := 3.25;
  elsif new.total_mark >= 60 then new.letter_grade := 'B';  new.grade_point := 3.00;
  elsif new.total_mark >= 55 then new.letter_grade := 'B-'; new.grade_point := 2.75;
  elsif new.total_mark >= 50 then new.letter_grade := 'C+'; new.grade_point := 2.50;
  elsif new.total_mark >= 45 then new.letter_grade := 'C';  new.grade_point := 2.25;
  elsif new.total_mark >= 40 then new.letter_grade := 'D';  new.grade_point := 2.00;
  else                            new.letter_grade := 'F';  new.grade_point := 0.00;
  end if;
  new.updated_at := now();
  return new;
end; $$ language plpgsql;

create trigger trg_compute_grade before insert or update on grades
for each row execute function compute_grade();
```

**GPA / CGPA** (student dashboard, credit-weighted):

```
GPA = Σ(grade_point × credit_hours) / Σ(credit_hours)
```

CGPA = across all courses; Semester GPA = grouped by `academic_year` + `semester`.

---

## 4. Enrollment System

- Admin-only create/edit/delete.
- `unique (student_id, course_id)` blocks duplicate enrollments.
- Enrolling immediately puts the student in the teacher's roster and GPA math.

---

## 5. Grade Recheck Request Workflow

- **Student** disputes a grade → insert `recheck_request` (status `Pending`, `teacher_id` from the course's teacher). Rules: grade must belong to the student; only **one pending** dispute per grade.
- **Teacher** resolves → set status `Approved`/`Rejected` + optional `teacher_comment`. Rules: only while `Pending`; only own-course requests.
- State: `Pending → Approved | Rejected` (terminal).

---

## 6. At-Risk / Early-Warning Feature

Flags students academically or attendance-wise at risk. Configurable thresholds (put in env/config):

| Threshold | Default |
|---|---|
| GPA High Risk | < 2.25 |
| GPA Medium Risk | < 2.75 |
| Attendance High Risk | < 60% |
| Attendance Medium Risk | < 75% |

**Metrics per student** (only over graded enrollments):

- **Running GPA** = credit-weighted average of `grade_point` (same formula as GPA above).
- **Attendance %** = `avg( (attendance_mark / 10) * 100 )` across graded courses. Example: 8/10 → 80%.

**Risk Level:**

- `High` if GPA < 2.25 **OR** Attendance < 60%
- `Medium` if GPA < 2.75 **OR** Attendance < 75%
- `Normal` otherwise

**Risk Type:**

- `Both` if both GPA and Attendance flagged
- `Academic` if only GPA flagged
- `Attendance` if only attendance flagged
- `None` otherwise

**Reason** = human-readable concatenation, e.g. `"Critical GPA (2.10 < 2.25); Low Attendance (72.0% < 75%)"`; `"No grades recorded yet"` if none; `"Satisfactory academic standing"` if clean.

**Where it's used:**

- **Student dashboard** — shows the student's own warning banner if not Normal.
- **Early-Warning panel** (admin + teacher; teacher sees only their students) — filter by department, risk level, risk type, name/roll/email search; shows totals, high/medium counts, avg at-risk GPA & attendance, CSV export.
- **Admin system report** — global counts, per-department and per-course breakdowns, pass rates, system averages.
- **`at_risk_flags` table** — snapshot/history synced on evaluation.

Implement as a **Postgres view / function** (best, since it's pure aggregation) exposed via Supabase RPC, or a Next.js Server Action:

```sql
create or replace view student_risk as
with graded as (
  select e.student_id,
         g.grade_point, g.attendance_mark, c.credit_hours
  from enrollments e
  join grades g  on g.enrollment_id = e.id
  join courses c on c.id = e.course_id
)
select s.id as student_id, s.roll_number, s.full_name, s.department,
       round(coalesce(sum(gr.grade_point*gr.credit_hours)/nullif(sum(gr.credit_hours),0),0),2) as running_gpa,
       round(coalesce(avg(gr.attendance_mark/10*100),0),1) as attendance_percent
from students s
left join graded gr on gr.student_id = s.id
group by s.id, s.roll_number, s.full_name, s.department;
```

Then classify `risk_level` / `risk_type` in SQL or in the app layer using the thresholds above.

---

## 7. Auth, Access Control & Seeding

- **Supabase Auth** for login. Password policy: enforce min 8 with digit + upper + lower + special in the sign-up form (Supabase lets you set min length; extra rules validated client/server-side).
- **`is_active`** → block login via RLS + middleware (sign out & redirect if false).
- **`must_change_password`** → middleware redirects to a change-password page until cleared. Set `true` when admin creates a student/teacher.
- **RLS policies** enforce: students see only their own rows; teachers see only their courses/rosters/disputes; admins see everything. Use `auth.uid()` joined through `profiles`.
- **Seed**: create the enums + one admin profile (e.g. `admin@yourapp.edu`) via a seed script / Supabase SQL.

**Feature access matrix:**

| Feature | admin | teacher | student |
|---|---|---|---|
| Manage students/teachers/courses/enrollments | ✅ | | |
| Enter/edit grades (own courses) | | ✅ | |
| Resolve recheck requests (own courses) | | ✅ | |
| View own courses/grades/GPA | | | ✅ |
| Submit recheck request | | | ✅ |
| Early-warning panel | ✅ | ✅ (own) | |
| System reports | ✅ | | |

**Auto account creation pattern:** when admin adds a student/teacher, create the `auth.users` account (Supabase Admin API), insert `profiles` row with the role + `must_change_password=true`, then insert the student/teacher row linked by `user_id`. Wrap in a transaction/RPC; roll back on failure.

---

## 8. Suggested Build Order

1. Supabase project → run the DDL above + enums.
2. Enable RLS + write policies per the access matrix.
3. Add the grading trigger + `student_risk` view/RPC.
4. Supabase Auth + `profiles`; seed admin; add `middleware.ts` guards.
5. shadcn/ui scaffolding (tables, forms, dialogs) for each feature.
6. Build features in order: admin CRUD → teacher grading → student dashboard → recheck → early-warning/reports.

---

## 9. Verification Checklist

- Duplicate-enrollment constraint fires on repeated `(student_id, course_id)`.
- Grade trigger produces correct letter/GPA at boundary marks (39/40/44/45/79/80).
- Recheck allows only one pending per grade and only teacher resolution.
- RLS blocks a student from reading another student's grades.
- At-risk classification matches thresholds (GPA < 2.25/2.75, attendance < 60%/75%).
