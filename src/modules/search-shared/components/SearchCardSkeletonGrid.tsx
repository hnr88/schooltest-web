import { Fragment } from 'react';

import type { SearchCardSkeletonGridProps } from '@/modules/search-shared/types/search-shared.types';

function SearchCardSkeletonGrid({ count = 6, label, card }: SearchCardSkeletonGridProps) {
  return (
    <div
      aria-busy="true"
      className="grid animate-in grid-cols-1 gap-4 duration-300 fade-in motion-reduce:animate-none md:grid-cols-2 2xl:grid-cols-3"
    >
      <span role="status" className="sr-only">
        {label}
      </span>
      {Array.from({ length: count }, (_, index) => (
        <Fragment key={index}>{card}</Fragment>
      ))}
    </div>
  );
}

export { SearchCardSkeletonGrid };
