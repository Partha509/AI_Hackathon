import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { chatComplete, isGroqConfigured, type ChatMessage } from "@/lib/ai/groq";
import { getFacultyDbContext } from "@/lib/ai/faculty-context";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the FacultyOS Co-Pilot, an assistant for university faculty at AUST (CSE).
You help faculty with academic tasks: exam question quality, grading consistency, and student grade disputes.
You are given a live snapshot of the FacultyOS database. Answer ONLY from that snapshot and the conversation.
- Cite concrete identifiers (course codes, script IDs, request IDs) when relevant.
- If the answer is not in the provided data, say so plainly — never invent records, names, or grades.
- Keep answers concise and professional. Final academic decisions always remain with the faculty.`;

export async function POST(request: Request) {
  try {
    // Faculty (and admins) may use the co-pilot.
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "faculty" && profile.role !== "admin")) {
      return NextResponse.json({ ok: false, error: "Faculty access required." }, { status: 403 });
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Groq is not configured. Add GROQ_API_KEY to .env." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages: ChatMessage[] = incoming
      .filter(
        (m: unknown): m is ChatMessage =>
          !!m &&
          typeof (m as ChatMessage).content === "string" &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant")
      )
      .slice(-12);

    if (messages.length === 0) {
      return NextResponse.json({ ok: false, error: "No messages provided." }, { status: 400 });
    }

    const dbContext = await getFacultyDbContext();

    const reply = await chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: dbContext },
      ...messages,
    ]);

    return NextResponse.json({ ok: true, data: { role: "assistant", content: reply } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
