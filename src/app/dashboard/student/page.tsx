import { LayoutDashboard } from "lucide-react";
import { StudentOverview } from "@/components/student/StudentOverview";

export const metadata = {
  title: "Student Overview | FacultyOS",
  description: "Your profile, course applications, and graded assessments at a glance.",
};

export default function StudentDashboardPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Overview &amp; Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your student profile and a summary of your academic activity.
          </p>
        </div>
      </div>
      <StudentOverview />
    </div>
  );
}
