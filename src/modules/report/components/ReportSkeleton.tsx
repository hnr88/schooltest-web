import { Skeleton } from '@/modules/design-system';

export function ReportSkeleton() {
  return (
    <main
      data-slot="report-skeleton"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-7"
    >
      <Skeleton className="h-5 w-40" />
      <div className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </main>
  );
}
