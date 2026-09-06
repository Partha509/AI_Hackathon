import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      <div className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-md" />
        <Skeleton className="h-10 w-96 max-w-full rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
