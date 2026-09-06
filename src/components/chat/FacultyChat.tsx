"use client";

import * as React from "react";
import { Bot, Loader2, Send, ShieldAlert, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME =
  "Greetings. I am your FacultyOS Co-Pilot. I can look up your academic data and take actions for you — create courses, add students or teachers (they get an email invite), and enroll students into courses. Just tell me what you need; I'll ask for any missing details before making changes.";

export function FacultyChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function send() {
    const text = input.trim();
    if (!text || isSending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Request failed.");
      setMessages((m) => [...m, { role: "assistant", content: json.data.content }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚠️ " + (err instanceof Error ? err.message : "Something went wrong. Please try again."),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
              Faculty Co-Pilot
              <span className="rounded-full border border-secondary/30 bg-secondary/15 px-2 py-0.5 text-[11px] font-normal text-secondary">
                Groq
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Connected to your live FacultyOS database
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Terminal className="h-3.5 w-3.5" />
          <span>Read-only DB access</span>
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4 sm:p-6"
      >
        <div className="flex gap-3">
          <Avatar assistant />
          <div className="max-w-2xl space-y-2">
            <div className="rounded-lg bg-muted p-4 text-sm text-foreground">
              <p className="leading-relaxed text-muted-foreground">{WELCOME}</p>
            </div>
            <div className="flex items-center gap-1.5 pl-1 text-[11px] text-muted-foreground">
              <ShieldAlert className="h-3 w-3 text-accent" />
              <span>AI Advisory: Final evaluation decisions remain with faculty</span>
            </div>
          </div>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <Avatar assistant={m.role === "assistant"} />
            <div
              className={cn(
                "max-w-2xl whitespace-pre-wrap rounded-lg p-4 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex gap-3">
            <Avatar assistant />
            <div className="flex items-center gap-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Tell the Co-Pilot… (e.g. 'Create course CSE 3205 Digital Logic' or 'Enroll Fahim into CSE 3201')"
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <Button size="sm" className="h-9 gap-1.5 px-4" onClick={send} disabled={isSending || !input.trim()}>
          <span>Send</span>
          {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function Avatar({ assistant }: { assistant?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md text-xs font-bold",
        assistant ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}
    >
      {assistant ? "OS" : "You"}
    </div>
  );
}
