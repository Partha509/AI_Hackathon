import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentEvaluations } from "@/components/student/StudentEvaluations";

export const metadata = {
  title: "Faculty Evaluations | FacultyOS",
  description: "Submit anonymous evaluations for courses you've completed.",
};

export default function StudentEvaluationsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Faculty Evaluations</h1>
            <p className="text-sm text-muted-foreground">
              Rate the teaching for courses that have ended. Responses are anonymous.
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/student">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </div>
      <StudentEvaluations />
    </div>
  );
}
