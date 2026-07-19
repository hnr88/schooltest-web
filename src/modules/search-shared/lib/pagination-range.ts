import type { PageToken } from '@/modules/search-shared/types/search-shared.types';

// First + last + a sibling window around the current page, ellipsis in the gaps.
export function getPaginationRange(page: number, pageCount: number, siblings = 1): PageToken[] {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(pageCount);
  for (let candidate = page - siblings; candidate <= page + siblings; candidate += 1) {
    if (candidate >= 1 && candidate <= pageCount) pages.add(candidate);
  }

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);
  const tokens: PageToken[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) tokens.push('ellipsis');
    tokens.push(value);
    previous = value;
  }

  return tokens;
}
