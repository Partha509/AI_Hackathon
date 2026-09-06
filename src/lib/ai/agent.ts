import "server-only";
import type Groq from "groq-sdk";
import { getGroq, GROQ_MODEL } from "@/lib/ai/groq";
import { CHAT_TOOLS, executeTool } from "@/lib/ai/tools";

type ApiMessage = { role: "user" | "assistant"; content: string };

export type AgentResult = {
  content: string;
  actions: { tool: string; args: unknown; result: unknown }[];
};

const MAX_ROUNDS = 5;

/** Runs the faculty co-pilot with tool-calling until it produces a final answer. */
export async function runFacultyAgent(
  system: string,
  history: ApiMessage[]
): Promise<AgentResult> {
  const groq = getGroq();
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...history,
  ];
  const actions: AgentResult["actions"] = [];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools: CHAT_TOOLS,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 1500,
    });

    const msg = completion.choices[0]?.message;
    if (!msg) break;

    const toolCalls = msg.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return { content: msg.content ?? "", actions };
    }

    // Record the assistant's tool-call turn, then execute each call.
    messages.push({
      role: "assistant",
      content: msg.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      let result: unknown;
      try {
        result = await executeTool(call.function.name, args);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "Tool failed." };
      }
      actions.push({ tool: call.function.name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Ran out of rounds — ask the model for a final summary without tools.
  const final = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      ...messages,
      { role: "user", content: "Summarize the outcome for the user in plain language." },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });
  return { content: final.choices[0]?.message?.content ?? "", actions };
}
