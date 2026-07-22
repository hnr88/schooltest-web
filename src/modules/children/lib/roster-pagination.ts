// Canonical table footer (DS §09 "Table & pagination", Students screen): the
// pager shows first/last and a window around the current page, with an ellipsis
// standing in for the pages it skips.
//
// 25 mirrors the page size GET /api/my/students itself serves, and the list read
// asks for 100 rows in one request — so client-side slicing is complete and the
// pager turns real for parent #26 onward. A smaller, more "demonstrable" size was
// rejected on purpose: it would hide children from a ten-child roster.
export const ROSTER_PAGE_SIZE = 25;

const WINDOW = 1;

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
