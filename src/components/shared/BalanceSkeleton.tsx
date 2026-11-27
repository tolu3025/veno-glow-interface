import { Skeleton } from "@/components/ui/skeleton";

const BalanceSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-48" />
    <div className="flex gap-2">
      <Skeleton className="h-9 w-20 rounded-lg" />
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="rounded-lg border bg-card p-4 shadow-soft space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export { BalanceSkeleton, CardSkeleton, ListSkeleton };
