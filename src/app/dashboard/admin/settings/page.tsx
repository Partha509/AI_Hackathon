import Link from "next/link";
import {
  Calendar,
  ArrowLeft,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getSystemSettingsAction,
  getStudentProfiles,
} from "@/app/actions/admin";
import { SessionSettingsManager } from "@/components/admin/SessionSettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settingsRes, studentsRes] = await Promise.all([
    getSystemSettingsAction(),
    getStudentProfiles(),
  ]);

  const currentSession = settingsRes.settings?.current_session || "Spring 2025";
  const students = studentsRes.students || [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard/admin" className="flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Admin Overview</span>
              </Link>
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="outline" className="text-xs font-normal">
              University Operations
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-primary" />
            Session Management & Academic Promotion
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Configure active university term sessions, audit undergraduate semester enrollment distributions, and trigger synchronized cohort progression.
          </p>
        </div>

        {/* Current Active Session Badge */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-border/80 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Active Term
            </span>
            <span className="font-heading text-lg font-extrabold text-primary">
              {currentSession}
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Manager with Destructive Promotion Modal */}
      <SessionSettingsManager
        currentSession={currentSession}
        students={students}
      />
    </div>
  );
}
