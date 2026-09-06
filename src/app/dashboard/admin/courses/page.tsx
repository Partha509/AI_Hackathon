import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminCourses, getFacultyProfiles } from "@/app/actions/admin";
import { CourseCatalogManager } from "@/components/admin/CourseCatalogManager";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const [coursesRes, facultyRes] = await Promise.all([
    getAdminCourses(),
    getFacultyProfiles(),
  ]);

  const courses = coursesRes.courses || [];
  const facultyList = facultyRes.faculty || [];

  const totalAssigned = courses.filter(
    (c) => c.faculty_name && c.faculty_name !== "Unassigned"
  ).length;
  const unassignedCount = courses.length - totalAssigned;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/dashboard/admin" className="flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Admin Overview</span>
              </Link>
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="outline" className="text-xs font-normal">
              Curriculum Control
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-primary" />
            Course & Faculty Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Create new academic curriculum courses, assign faculty instructors, and maintain semester syllabus structures.
          </p>
        </div>

        {/* Quick Stat Highlights */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Total Courses
            </span>
            <span className="font-heading text-xl font-extrabold text-foreground">
              {courses.length}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Assigned
            </span>
            <span className="font-heading text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalAssigned}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Unassigned
            </span>
            <span className={`font-heading text-xl font-extrabold ${
              unassignedCount > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}>
              {unassignedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Course Catalog Manager with Search, Modals, and Tables */}
      <CourseCatalogManager
        initialCourses={courses}
        facultyList={facultyList}
      />
    </div>
  );
}
