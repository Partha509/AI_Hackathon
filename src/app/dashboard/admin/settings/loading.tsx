import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-9 w-96 max-w-full rounded-md" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      {/* Settings Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
