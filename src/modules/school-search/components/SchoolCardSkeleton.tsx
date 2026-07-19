import { Skeleton } from '@/modules/design-system';

function SchoolCardSkeleton() {
  return (
    <div
      data-slot="school-card-skeleton"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-sm" />
        <Skeleton className="ml-auto h-3 w-10 rounded-sm" />
      </div>
      <Skeleton className="h-4 w-3/4 rounded-sm" />
      <Skeleton className="h-3 w-1/2 rounded-sm" />
      <div className="flex gap-1.5">
        <Skeleton className="h-3 w-14 rounded-sm" />
        <Skeleton className="h-3 w-16 rounded-sm" />
      </div>
      <Skeleton className="mt-auto h-3 w-24 rounded-sm" />
    </div>
  );
}

export { SchoolCardSkeleton };
