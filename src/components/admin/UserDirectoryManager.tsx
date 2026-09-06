"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Building2,
  Calendar,
  Hash,
  FilterX,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateFacultyModal } from "@/components/admin/CreateFacultyModal";
import { CreateStudentModal } from "@/components/admin/CreateStudentModal";
import { ALL_SEMESTERS_WITH_GRAD } from "@/lib/semester-utils";
import type { Profile } from "@/lib/supabase/types";

interface UserDirectoryManagerProps {
  initialUsers: Profile[];
}

export function UserDirectoryManager({
  initialUsers,
}: UserDirectoryManagerProps) {
  const router = useRouter();
  const [users, setUsers] = React.useState<Profile[]>(initialUsers);
  const [roleFilter, setRoleFilter] = React.useState<
    "all" | "faculty" | "student" | "admin"
  >("all");
  const [semesterFilter, setSemesterFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleRefresh = () => {
    router.refresh();
  };

  const facultyCount = users.filter((u) => u.role === "faculty").length;
  const studentCount = users.filter((u) => u.role === "student").length;

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // Semester filter (if student)
      if (
        semesterFilter !== "all" &&
        u.role === "student" &&
        u.current_semester !== semesterFilter
      ) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = u.full_name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const idMatch = u.student_id_number?.toLowerCase().includes(q);
      const deptMatch = u.department?.toLowerCase().includes(q);

      return nameMatch || emailMatch || idMatch || deptMatch;
    });
  }, [users, roleFilter, semesterFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters & Creation Modals */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        {/* Search & Role Filter */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or Student ID..."
              className="pl-9 h-9 text-xs bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
              className="h-8 text-xs"
            >
              All ({users.length})
            </Button>
            <Button
              variant={roleFilter === "faculty" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("faculty")}
              className="h-8 text-xs gap-1.5"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Faculty ({facultyCount})</span>
            </Button>
            <Button
              variant={roleFilter === "student" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("student")}
              className="h-8 text-xs gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Students ({studentCount})</span>
            </Button>
          </div>

          {/* Optional Semester Filter for Students */}
          {roleFilter !== "faculty" && (
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Semesters</option>
              {ALL_SEMESTERS_WITH_GRAD.map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Modals */}
        <div className="flex items-center gap-2.5 shrink-0">
          <CreateFacultyModal onUserCreated={handleRefresh} />
          <CreateStudentModal onUserCreated={handleRefresh} />
        </div>
      </div>

      {/* Directory Table */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <FilterX className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            No accounts found
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || roleFilter !== "all"
              ? "No user accounts match your active search term or filter settings."
              : "No user accounts have been provisioned in the directory yet."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || roleFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setSemesterFilter("all");
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            )}
            <CreateFacultyModal onUserCreated={handleRefresh} />
            <CreateStudentModal onUserCreated={handleRefresh} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="min-w-[220px] font-semibold text-foreground">
                  User Account
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-foreground">
                  Role
                </TableHead>
                <TableHead className="min-w-[150px] font-semibold text-foreground">
                  Student ID Number
                </TableHead>
                <TableHead className="w-[120px] text-center font-semibold text-foreground">
                  Semester
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-foreground">
                  Dept
                </TableHead>
                <TableHead className="w-[140px] text-right font-semibold text-foreground">
                  Registered
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isFaculty = user.role === "faculty";
                const isStudent = user.role === "student";
                const isAdmin = user.role === "admin";

                return (
                  <TableRow key={user.id} className="hover:bg-muted/20">
                    {/* User Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                            isFaculty
                              ? "bg-primary/15 text-primary"
                              : isStudent
                              ? "bg-accent/20 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground block text-sm">
                            {user.full_name}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell>
                      {isAdmin && (
                        <Badge variant="default" className="bg-primary text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {isFaculty && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1"
                        >
                          <GraduationCap className="h-3 w-3" />
                          Faculty
                        </Badge>
                      )}
                      {isStudent && (
                        <Badge
                          variant="outline"
                          className="bg-accent/10 text-accent-foreground border-accent/30 text-[10px] gap-1"
                        >
                          <Users className="h-3 w-3" />
                          Student
                        </Badge>
                      )}
                    </TableCell>

                    {/* Student ID Number */}
                    <TableCell>
                      {isStudent ? (
                        <span className="font-mono text-xs font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
                          {user.student_id_number || "Pending Assignment"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Semester Level */}
                    <TableCell className="text-center">
                      {isStudent ? (
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono font-bold ${
                            user.current_semester === "Graduated"
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary border-primary/30"
                          }`}
                        >
                          {user.current_semester || "3.2"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Department */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {user.department || "CSE"}
                      </Badge>
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Active"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
