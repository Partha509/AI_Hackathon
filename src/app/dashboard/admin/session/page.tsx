import { CalendarClock } from "lucide-react";
import { SessionPanel } from "@/components/admin/SessionPanel";

export const metadata = {
  title: "Session & Advancement | FacultyOS",
  description: "Manage the current academic session and advance students.",
};

export default function AdminSessionPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Session &amp; Advancement</h1>
          <p className="text-sm text-muted-foreground">
            Start the next session to advance all active students one semester.
          </p>
        </div>
      </div>
      <SessionPanel />
    </div>
  );
}
