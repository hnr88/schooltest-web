const TILES = [0, 1, 2, 3];
const RAIL = [0, 1];

// Shaped like the profile it becomes: hero, the snapshot panel of compact tiles
// and the timeline panel in the main column, gauge + record panels in the rail.
// The trail is the topbar's, so there is no breadcrumb bar to reserve. Uses the
// canonical shimmer sweep, which flattens under reduced motion.
export function ChildProfileSkeleton() {
  return (
    <main
      aria-hidden="true"
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center">
        <span className="size-16 shrink-0 rounded-full shimmer-sweep sm:size-18" />
        <div className="flex flex-1 flex-col gap-2.5">
          <span className="h-6 w-52 rounded-full shimmer-sweep" />
          <span className="h-3.5 w-72 max-w-full rounded-full shimmer-sweep" />
          <span className="h-5.5 w-40 rounded-full shimmer-sweep" />
        </div>
        <span className="h-11 w-28 rounded-lg shimmer-sweep" />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <span className="h-4.5 w-44 rounded-full shimmer-sweep" />
          <div className="grid gap-3 sm:grid-cols-2">
            {TILES.map((tile) => (
              <span key={tile} className="h-16 rounded-tile shimmer-sweep" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-panel border border-border bg-card p-6 shadow-sm">
          <span className="h-4.5 w-40 self-start rounded-full shimmer-sweep" />
          <span className="size-30 rounded-full shimmer-sweep" />
          <span className="h-12 w-full rounded-tile shimmer-sweep" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6 shadow-sm">
        <span className="h-4.5 w-48 rounded-full shimmer-sweep" />
        <span className="h-24 w-full rounded-tile shimmer-sweep" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {RAIL.map((panel) => (
          <span key={panel} className="h-56 rounded-panel shimmer-sweep" />
        ))}
      </div>
    </main>
  );
}
