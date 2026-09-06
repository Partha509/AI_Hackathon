import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Header/banner placeholder used at the top of dashboard pages. */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

/** Row of stat cards. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Generic table placeholder. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
      <Skeleton className="mb-4 h-6 w-48" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid of card placeholders (e.g. course catalog). */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Full-page dashboard skeleton composed from the pieces above. */
export function DashboardPageSkeleton({
  stats = 4,
  variant = "table",
  className,
}: {
  stats?: number;
  variant?: "table" | "cards";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8",
        className
      )}
    >
      <PageHeaderSkeleton />
      {stats > 0 && <StatCardsSkeleton count={stats} />}
      {variant === "cards" ? <CardGridSkeleton /> : <TableSkeleton />}
    </div>
  );
}
