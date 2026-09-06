import "server-only";
import Groq from "groq-sdk";

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let client: Groq | null = null;

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/** Returns a singleton Groq client. Throws a clear error if the key is missing. */
export function getGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Groq is not configured. Set GROQ_API_KEY in .env (get one at https://console.groq.com/keys)."
    );
  }
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Basic non-streaming chat completion. */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: opts?.temperature ?? 0.3,
    max_tokens: opts?.maxTokens ?? 1024,
  });
  return completion.choices[0]?.message?.content ?? "";
}
