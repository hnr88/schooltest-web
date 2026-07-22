const CARDS = [0, 1, 2, 3];
const CELLS = [0, 1, 2];

// AN-1 shaped for the card grid it becomes: a 52px avatar circle, 60%/40% name and
// meta bars, then three metric tiles — the shapes the design's own loading note
// prescribes (spec 02 §AN-1). The sweep flattens to its base tint under
// prefers-reduced-motion.
export function ChildrenRosterSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="h-10 w-full max-w-85 shimmer-sweep rounded-full" />
        <span className="h-10 w-40 shimmer-sweep rounded-full" />
      </div>
      <div className="grid grid-cols-child-cards gap-5">
        {CARDS.map((card) => (
          <div key={card} className="flex flex-col gap-5.5 rounded-card bg-card p-7 shadow-sm">
            <div className="flex items-center gap-3.5">
              <span className="size-13 shrink-0 shimmer-sweep rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="h-4 w-3/5 shimmer-sweep rounded-full" />
                <span className="h-3 w-2/5 shimmer-sweep rounded-full" />
              </div>
              <span className="h-5.5 w-20 shimmer-sweep rounded-full" />
            </div>
            <div className="flex gap-4.5 border-t border-divider pt-5">
              {CELLS.map((cell) => (
                <span key={cell} className="h-11 flex-1 shimmer-sweep rounded-tile" />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="h-3 w-1/2 shimmer-sweep rounded-full" />
              <span className="h-3 w-16 shimmer-sweep rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
