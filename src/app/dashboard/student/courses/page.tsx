import { BookOpen } from "lucide-react";
import { StudentCourses } from "@/components/student/StudentCourses";

export const metadata = {
  title: "Course Applications | FacultyOS",
  description: "Browse the course catalog and apply for courses pending admin approval.",
};

export default function StudentCoursesPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Course Applications</h1>
          <p className="text-sm text-muted-foreground">
            Browse available courses and apply. Applications await administrator approval.
          </p>
        </div>
      </div>
      <StudentCourses />
    </div>
  );
}
