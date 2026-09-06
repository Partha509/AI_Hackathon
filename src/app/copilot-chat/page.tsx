import { Bot, Send, Sparkles, Terminal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CopilotChatPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col flex-1 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              Faculty Co-Pilot
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                Gemini 3.8 Intelligence
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Direct access to Exam Checker, Consistency Analyzer, and Live Database Queries
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          <span>Active Skills: 8 Registered</span>
        </div>
      </div>

      {/* Chat Conversation Area */}
      <div className="flex-1 overflow-y-auto space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6 mb-4">
        {/* Assistant Welcome Message */}
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            OS
          </div>
          <div className="space-y-2 max-w-2xl">
            <div className="rounded-lg bg-muted p-4 text-sm text-foreground space-y-2">
              <p className="font-semibold text-primary">
                Greetings, Faculty Member. I am your FacultyOS Academic Co-Pilot.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I can assist you with your academic responsibilities:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground pl-1">
                <li><span className="font-medium text-foreground">Exam Quality:</span> Audit Fall 2024 / Spring 2025 question papers for Bloom's taxonomy & syllabus coverage.</li>
                <li><span className="font-medium text-foreground">Grading Consistency:</span> Compare Dr. Tanvir and Lecturer Hasan's marks on student scripts.</li>
                <li><span className="font-medium text-foreground">Dispute Arbitration:</span> Re-evaluate Sabbir Ahmed's appeal (req-101) against the rubric.</li>
              </ul>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-1">
              <ShieldAlert className="h-3 w-3 text-accent" />
              <span>AI Advisory: Final evaluation decision remains with Faculty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div className="rounded-lg border border-border bg-card p-2 flex items-center gap-2 shadow-sm">
        <input
          type="text"
          placeholder="Ask FacultyOS: e.g. 'Audit the Spring 2025 exam questions for CSE 321'..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <Button size="sm" className="h-9 px-4 gap-1.5">
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
