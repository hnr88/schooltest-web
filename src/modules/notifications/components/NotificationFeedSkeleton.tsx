const ROWS = [0, 1, 2, 3];

// Loading placeholder drawn on the feed's own geometry — 40px tile, three text
// lines, 8px trailing dot — so nothing jumps when the real rows arrive. The sweep is
// the shared `shimmer-sweep` utility, which flattens under prefers-reduced-motion.
export function NotificationFeedSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {ROWS.map((row) => (
        <div key={row} className="flex items-start gap-4 border-b border-divider py-4.25 last:border-b-0">
          <span className="size-10 shrink-0 rounded-tile shimmer-sweep" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="h-3.5 w-1/2 rounded-sm shimmer-sweep" />
            <span className="h-3 w-4/5 rounded-sm shimmer-sweep" />
            <span className="h-2.5 w-20 rounded-sm shimmer-sweep" />
          </div>
          <span className="mt-1.5 size-2 shrink-0 rounded-full shimmer-sweep" />
        </div>
      ))}
    </div>
  );
}
