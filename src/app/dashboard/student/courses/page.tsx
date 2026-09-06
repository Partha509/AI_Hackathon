import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Calendar,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStudentCoursesData } from "@/app/actions/student";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { StudentCourseApplicationView } from "@/components/student/StudentCourseApplicationView";

export const dynamic = "force-dynamic";

export default async function StudentCoursesPage() {
  // Load the signed-in student so their real application status is fetched
  // (otherwise the catalog falls back to the first student and shows nothing applied).
  const profile = await getCurrentProfile();
  const data = await getStudentCoursesData(profile?.id);
  const student = data.student!;
  const courses = data.courses || [];

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
              <Link href="/grade-disputes" className="flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Student Portal</span>
              </Link>
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="outline" className="text-xs font-normal">
              Course Registration & Petitions
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-primary" />
            Curriculum Course Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Review departmental course offerings for your registered academic semester level and submit enrollment petitions.
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-auto py-2.5">
            <Link href="/dashboard/student/evaluations" className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              Faculty Evaluations
            </Link>
          </Button>
          <div className="rounded-xl border border-border/80 bg-card px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Academic Standing
            </span>
            <span className="font-heading text-lg font-extrabold text-primary font-mono">
              Semester {student?.current_semester || "3.2"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Student Course Application View */}
      <StudentCourseApplicationView
        student={student}
        courses={courses as any}
      />
    </div>
  );
}
