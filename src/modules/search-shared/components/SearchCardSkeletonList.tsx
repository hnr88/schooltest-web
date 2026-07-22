import { cn } from '@/lib/utils';
import { SkeletonCard } from '@/modules/design-system';
import type { SearchCardSkeletonListProps } from '@/modules/search-shared/types/search-shared.types';

// Canonical SkeletonCard (Inventory §03) laid out on the SAME grid the loaded results
// use, so nothing shifts when the query settles. Replaces the two hand-rolled per-pane
// skeletons.
function SearchCardSkeletonList({ count = 4, label, className }: SearchCardSkeletonListProps) {
  return (
    <div
      aria-busy="true"
      className={cn(
        'flex animate-in flex-col gap-4 duration-300 fade-in motion-reduce:animate-none',
        className,
      )}
    >
      <span role="status" className="sr-only">
        {label}
      </span>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} rows={4} />
      ))}
    </div>
  );
}

export { SearchCardSkeletonList };
