import Link from "next/link";
import {
  Users,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Building2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllUsersAction } from "@/app/actions/admin";
import { UserDirectoryManager } from "@/components/admin/UserDirectoryManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const usersRes = await getAllUsersAction();
  const users = usersRes.users || [];

  const facultyCount = users.filter((u) => u.role === "faculty").length;
  const studentCount = users.filter((u) => u.role === "student").length;

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
              Identity & Access Management
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            User Provisioning & Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Provision verified faculty instructors and undergraduate students with immutable Student ID Numbers and current semester levels.
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Total Accounts
            </span>
            <span className="font-heading text-xl font-extrabold text-foreground">
              {users.length}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Faculty
            </span>
            <span className="font-heading text-xl font-extrabold text-primary">
              {facultyCount}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Students
            </span>
            <span className="font-heading text-xl font-extrabold text-accent">
              {studentCount}
            </span>
          </div>
        </div>
      </div>

      {/* Directory Management Table with Modals */}
      <UserDirectoryManager initialUsers={users} />
    </div>
  );
}
