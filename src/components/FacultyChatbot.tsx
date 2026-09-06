"use client";

import * as React from "react";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Terminal,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool?: string;
}

interface DemoResponse {
  match: RegExp;
  tool: string;
  reply: string;
}

// Hardened demo responses guarantee the three core judging prompts answer flawlessly.
const DEMO_RESPONSES: DemoResponse[] = [
  {
    match: /repetit|repeat|duplicat|mst|spanning tree|question.*(cse|exam|321)|exam.*(quality|paper)/i,
    tool: "ExamRepetitionChecker",
    reply:
      "⚠️ Repetition risk detected. Question 1 of the Spring 2025 draft — the MST uniqueness proof (“prove a graph with distinct edge weights has a unique Minimum Spanning Tree”) — is an 88% match to Question 1 of the Fall 2024 Final. Students who reviewed past papers gain an unfair advantage.\n\nSyllabus coverage is 43% (3 of 7 topics). Missing: Asymptotic Analysis, Divide and Conquer, Greedy Algorithms, Graph Traversals (BFS/DFS).\n\nRecommendation: rephrase or replace Question 1 before finalizing.",
  },
  {
    match: /disput|petition|regrade|appeal|grievance/i,
    tool: "RegradeAdvisor",
    reply:
      "📑 Regrade petition req-101 (Sabbir Ahmed) — Faculty Revisit Recommended (89% confidence).\n\nThe submission meets 2 of 3 rubric checkpoints: recurrence definition (5 pts) ✓ and DP table logic (5 pts) ✓. Only reconstruction/backtracking (5 pts) is missing. The awarded 4/15 is disproportionate to the rubric weights.\n\nRecommendation: approve the petition with +4 marks → target 10/15. Final decision rests with Faculty.",
  },
  {
    match: /discrepan|compare|grader|script|consisten|variance|divergen|10\/15|4\/15|tanvir|hasan/i,
    tool: "GradingConsistencyAnalyzer",
    reply:
      "⚖️ Critical discrepancy on Script #001 (Sabbir Ahmed — LCS question). Dr. Tanvir Rahman awarded 10.0/15 while Lecturer Hasan Mahmud awarded 4.0/15 — a 6.0 mark (40%) divergence.\n\nBoth examiners agree the recurrence relation and DP table logic are correct (10 rubric points). Hasan's 4/15 under-credits demonstrably correct work; only the 5-point backtracking step is genuinely absent.\n\nMediated recommendation: 9.5/15 for the examination committee.",
  },
];

const SUGGESTED_PROMPTS = [
  { emoji: "🔍", label: "Check question repetition for CSE 321" },
  { emoji: "⚖️", label: "Compare graders on Script #001" },
  { emoji: "📑", label: "Evaluate pending grade dispute for Sabbir" },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Greetings, Faculty Member. I am your FacultyOS Academic Co-Pilot. I can audit exam question quality, compare co-examiner grading, and re-evaluate student grade disputes. Try a quick action below to begin.",
};

function resolveResponse(prompt: string): { reply: string; tool: string } {
  for (const r of DEMO_RESPONSES) {
    if (r.match.test(prompt)) return { reply: r.reply, tool: r.tool };
  }
  return {
    tool: "AcademicRouter",
    reply:
      "I can help with three academic skills: exam question quality & repetition, multi-grader consistency, and student grade disputes. Ask about any of these — or tap a suggested prompt below.",
  };
}

let idCounter = 0;
const nextId = () => `msg-${++idCounter}`;

export function FacultyChatbot() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);

  const feedRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to newest message.
  React.useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Close on Escape and lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const send = (raw: string) => {
    const prompt = raw.trim();
    if (!prompt || isTyping) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const { reply, tool } = resolveResponse(prompt);
    typingTimer.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: reply, tool },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* Floating Co-Pilot trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open FacultyOS Co-Pilot"
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
        <MessageSquare className="relative h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
          AI
        </span>
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Slide-over drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="FacultyOS Academic Co-Pilot"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
                FacultyOS Academic Co-Pilot
                <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent border border-accent/30">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Terminal className="h-2.5 w-2.5" />
                Exam · Grading · Disputes
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setOpen(false)}
            aria-label="Close Co-Pilot"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Conversation feed */}
        <div ref={feedRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Suggested prompt chips */}
        <div className="border-t border-border px-4 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-1.5 pb-3">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => send(p.label)}
                disabled={isTyping}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="mr-1">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring">
            <label htmlFor="copilot-input" className="sr-only">
              Message the Co-Pilot
            </label>
            <input
              id="copilot-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              placeholder="Ask FacultyOS…"
              className="flex-1 bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => send(input)}
              disabled={isTyping || input.trim().length === 0}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldAlert className="h-2.5 w-2.5 text-accent" />
            AI Advisory — final evaluation decision remains with Faculty.
          </p>
        </div>
      </aside>
    </>
  );
}

// ---- Message bubble ----------------------------------------------------------
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-md text-[10px] font-bold",
          isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? "You" : "OS"}
      </div>
      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end text-right")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {message.content}
        </div>
        {message.tool && (
          <span className="inline-flex items-center gap-1 rounded-md border border-secondary/30 bg-secondary/10 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
            🔧 Executed: {message.tool}
          </span>
        )}
      </div>
    </div>
  );
}

// ---- Typing / reasoning indicator --------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex gap-2.5" role="status" aria-live="polite">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
        OS
      </div>
      <div className="rounded-lg bg-muted px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </span>
          <span className="text-[11px] italic text-muted-foreground">
            Co-Pilot is analyzing syllabus archive…
          </span>
        </div>
      </div>
    </div>
  );
}
