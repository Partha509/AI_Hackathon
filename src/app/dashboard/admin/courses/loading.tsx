import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCoursesLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-9 w-80 max-w-full rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-28 rounded-xl" />
          <Skeleton className="h-14 w-28 rounded-xl" />
        </div>
      </div>

      {/* Catalog Table Skeleton */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-10 w-72 max-w-full rounded-md" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
