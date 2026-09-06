import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="space-y-4 border-b border-border/80 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-80 max-w-full rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        {/* Action Buttons Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Stat Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-3 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column Section Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Catalog Table Skeleton */}
        <div className="xl:col-span-2 rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>

        {/* Pending Queue Skeleton */}
        <div className="xl:col-span-1 rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-44 rounded-md" />
            </div>
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
