import { FileCheck } from "lucide-react";
import { StudentGrades } from "@/components/student/StudentGrades";

export const metadata = {
  title: "Exam Marks & Grades | FacultyOS",
  description: "View graded exam answers, examiner feedback, and request regrades.",
};

export default function StudentGradesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Exam Marks &amp; Grades</h1>
          <p className="text-sm text-muted-foreground">
            Your graded answers with examiner feedback. Appeal a mark if you disagree.
          </p>
        </div>
      </div>
      <StudentGrades />
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Regrade outcomes are finalized by faculty.
      </p>
    </div>
  );
}
