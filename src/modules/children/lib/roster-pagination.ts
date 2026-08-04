import { ROSTER_PAGE_SIZE, WINDOW } from '@/modules/children/constants/lib.constants';

export function getPageCount(total: number, pageSize = ROSTER_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(page, 1), pageCount);
}

// Ascending page numbers to render as buttons. A gap between two numbers is the
// caller's cue to draw the canonical "…" separator, so no sentinel value leaks
// into the list.
export function getPageNumbers(page: number, pageCount: number): number[] {
  const pages = new Set<number>([1, pageCount]);
  for (let offset = -WINDOW; offset <= WINDOW; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= pageCount) {
      pages.add(candidate);
    }
  }
  return [...pages].sort((a, b) => a - b);
}
