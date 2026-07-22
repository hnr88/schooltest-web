import { DataPanel } from '@/modules/design-system';

const ROWS = [0, 1, 2, 3, 4];

// Loading state shaped like the roster it becomes: one panel, hairline rows, the
// canonical shimmer sweep (static tint under reduced motion).
export function ChildrenRosterSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="h-10 w-full max-w-85 rounded-lg shimmer-sweep" />
        <span className="h-10 w-40 rounded-lg shimmer-sweep" />
      </div>
      <DataPanel>
        <div className="h-11 border-b border-border bg-background" />
        {ROWS.map((row) => (
          <div
            key={row}
            className="flex items-center gap-3 border-b border-muted px-5 py-3.5 last:border-b-0"
          >
            <span className="size-8.5 shrink-0 rounded-full shimmer-sweep" />
            <span className="h-3.5 w-40 rounded-full shimmer-sweep" />
            <span className="ml-auto h-3.5 w-24 rounded-full shimmer-sweep" />
            <span className="h-5.5 w-20 rounded-full shimmer-sweep" />
          </div>
        ))}
      </DataPanel>
    </div>
  );
}
