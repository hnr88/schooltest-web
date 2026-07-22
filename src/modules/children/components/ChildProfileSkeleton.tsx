const KPI_CELLS = [0, 1, 2, 3];
const RAILS = [0, 1, 2];
const ROWS = [0, 1, 2];

// Shaped like the five blocks it becomes: header, the r24 KPI card, the two-up
// Journey/Skills grid and the results panel. Uses the canonical shimmer sweep,
// which flattens to its base tint under prefers-reduced-motion.
export function ChildProfileSkeleton() {
  return (
    <main
      aria-hidden="true"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className="size-15 shrink-0 shimmer-sweep rounded-full" />
        <div className="flex min-w-50 flex-1 flex-col gap-2.5">
          <span className="h-7 w-56 max-w-full shimmer-sweep rounded-full" />
          <span className="h-3.5 w-72 max-w-full shimmer-sweep rounded-full" />
        </div>
        <span className="h-11 w-24 shimmer-sweep rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-6 rounded-card bg-card px-7 py-6 shadow-sm lg:grid-cols-4">
        {KPI_CELLS.map((cell) => (
          <div key={cell} className="flex flex-col gap-2">
            <span className="h-3 w-24 shimmer-sweep rounded-full" />
            <span className="h-7 w-14 shimmer-sweep rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-portal-two-up gap-5">
        {[0, 1].map((panel) => (
          <div
            key={panel}
            className="flex flex-col gap-6 rounded-card bg-card px-7.5 py-6 shadow-sm"
          >
            <span className="h-5 w-36 shimmer-sweep rounded-full" />
            {RAILS.map((rail) => (
              <span key={rail} className="h-9 w-full shimmer-sweep rounded-tile" />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-card px-7.5 py-6 shadow-sm">
        <span className="h-5 w-44 shimmer-sweep rounded-full" />
        {ROWS.map((row) => (
          <span key={row} className="h-10 w-full shimmer-sweep rounded-tile" />
        ))}
      </div>
    </main>
  );
}
