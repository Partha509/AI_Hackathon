import { Skeleton } from "@/components/ui/skeleton";

export default function FacultyLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
