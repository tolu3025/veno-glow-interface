import { cn } from "@/lib/utils";

export const Shimmer = ({ className }: { className?: string }) => (
  <div className={cn("skeleton-shimmer rounded-xl", className)} />
);

export const HomeSkeleton = () => (
  <div className="px-5 pt-10 pb-24 space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-5 w-32" />
      </div>
      <Shimmer className="h-10 w-10 rounded-full" />
    </div>
    <Shimmer className="h-44 rounded-3xl" />
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Shimmer className="h-[72px] w-[72px] rounded-2xl" />
          <Shimmer className="h-2.5 w-12" />
        </div>
      ))}
    </div>
    <div className="space-y-2.5">
      {[0, 1, 2].map(i => (
        <Shimmer key={i} className="h-16" />
      ))}
    </div>
  </div>
);

export const ListSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="px-5 pt-10 pb-24 space-y-3 animate-fade-in">
    <Shimmer className="h-7 w-40 mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <Shimmer key={i} className="h-16" />
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="px-5 pt-10 pb-24 space-y-4 animate-fade-in">
    <Shimmer className="h-7 w-44" />
    <Shimmer className="h-32" />
    <Shimmer className="h-48" />
    <Shimmer className="h-12" />
  </div>
);

export const BalanceSkeleton = () => <Shimmer className="h-44 rounded-3xl" />;
