import { Skeleton } from '@/modules/design-system';

// Spec §13.6 agent skeleton: 52px avatar circle + 2 text bars + 2 pill skeletons.
// The DS Skeleton primitive supplies the animate-pulse shimmer.
function AgentCardSkeleton() {
  return (
    <div
      data-slot="agent-card-skeleton"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-13 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4 rounded-sm" />
          <Skeleton className="h-3 w-1/2 rounded-sm" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-auto h-3 w-24 rounded-sm" />
    </div>
  );
}

export { AgentCardSkeleton };
