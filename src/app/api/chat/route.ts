import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { isGroqConfigured } from "@/lib/ai/groq";
import { runFacultyAgent } from "@/lib/ai/agent";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the FacultyOS Co-Pilot, a proactive assistant for university faculty and administrators at AUST (CSE).

You can READ and perform ACTIONS via tools:
- list_courses, find_users — look up live data.
- create_course — create a course (code encodes semester in first 2 digits, e.g. CSE 3201 → 3.2).
- create_user — create a student or teacher (role 'faculty' = teacher); an email invite link is returned.
- enroll_student — enroll a student into a course by code.

How to be smart and resilient:
- Gather required fields before acting. If something is missing, ask ONE concise question. Never invent values.
  - Course: code + title (instructor name is optional free text and need NOT be an existing teacher).
  - Teacher: full name + email.
  - Student: full name + email + student ID + current semester (1.1–4.2).
- Chain steps to fulfill a goal (e.g. "add student X and enroll in CSE 2103" → create_user then enroll_student). Use find_users/list_courses to resolve names to exact records.
- When a tool returns an error, DO NOT give up. Read the error, explain it plainly, and either fix it yourself or ask the user for the one missing/ambiguous detail. Examples:
  - "No student found" → offer to create the student, or ask for the exact email/ID.
  - "Multiple students match" → list them and ask which one.
  - "course code invalid" → explain the DEPT + 4-digit format where the first two digits are the semester, and suggest a corrected code.
  - "already exists" → say so and continue with what the user actually wants.
- If the user clearly said to proceed, act without re-confirming. Otherwise, for create/enroll, confirm the details in one short line, then act.
- Be concise, warm, and professional. Cite concrete identifiers. Report exactly what happened, including invite links. Never claim you lack access — you have full read/write tools. Final academic decisions remain with faculty.`;

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "faculty" && profile.role !== "admin")) {
      return NextResponse.json(
        { ok: false, error: "Faculty or admin access required." },
        { status: 403 }
      );
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Groq is not configured. Add GROQ_API_KEY to .env." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = incoming
      .filter(
        (m: unknown) =>
          !!m &&
          typeof (m as { content?: unknown }).content === "string" &&
          ((m as { role?: string }).role === "user" ||
            (m as { role?: string }).role === "assistant")
      )
      .slice(-12) as { role: "user" | "assistant"; content: string }[];

    if (messages.length === 0) {
      return NextResponse.json({ ok: false, error: "No messages provided." }, { status: 400 });
    }

    const system = `${SYSTEM_PROMPT}\n\nActing user: ${profile.full_name} (${profile.role}).`;
    const result = await runFacultyAgent(system, messages);

    return NextResponse.json({
      ok: true,
      data: { role: "assistant", content: result.content, actions: result.actions },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
