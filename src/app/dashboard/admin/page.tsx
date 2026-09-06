import Link from "next/link";
import { ArrowRight, CalendarClock, ShieldCheck, Users } from "lucide-react";
import { SessionPanel } from "@/components/admin/SessionPanel";

export const metadata = {
  title: "Admin Console | FacultyOS",
  description: "Manage accounts and academic sessions.",
};

export default function AdminHomePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            Provision accounts and manage the academic session.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SessionPanel />
        <div className="grid gap-4">
          <QuickLink
            href="/dashboard/admin/users"
            icon={Users}
            title="Manage Accounts"
            description="Create student & teacher IDs and send invitations."
          />
          <QuickLink
            href="/dashboard/admin/session"
            icon={CalendarClock}
            title="Session & Advancement"
            description="Start the next session and advance students."
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
