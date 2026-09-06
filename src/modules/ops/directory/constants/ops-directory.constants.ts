/**
 * Task 04 — kit-wide constants and the English label defaults.
 *
 * The pagination constants restate the SERVER contract, not a client whim:
 * src/api/ops/lib/ops-pagination.ts serves page 1, pageSize 25, max 200 and
 * rejects `q` above 120 with a 400. The client keeps the same numbers so a
 * consumer can never build a request the server must refuse.
 */
import type { DirectoryLabels } from '../types/ops-directory.types';

export const DIRECTORY_ALL = 'all';
export const DIRECTORY_PAGE_SIZE_DEFAULT = 25;
export const DIRECTORY_PAGE_SIZE_MAX = 200;
export const DIRECTORY_Q_MAX = 120;

/** Search is debounced before it reaches URL/state — the Ops schools timing. */
export const DIRECTORY_SEARCH_DEBOUNCE_MS = 200;

/** URL parameter names; a filter def's `key` is its own param name. */
export const DIRECTORY_PARAMS = {
  q: 'q',
  sort: 'sort',
  page: 'page',
} as const;

/**
 * English defaults for every overridable string. Adopting surfaces replace
 * these with translated labels (the props are plain strings/functions so a
 * `useTranslations` result drops straight in).
 */
export const DIRECTORY_DEFAULT_LABELS: DirectoryLabels = {
  searchPlaceholder: 'Search',
  searchLabel: 'Search',
  filtersLabel: 'Filters',
  sortLabel: 'Sort',
  clearFilters: 'Clear filters',
  paginationLabel: 'Pagination',
  previous: 'Previous',
  next: 'Next',
  rowMenuLabel: 'Row actions',
  selectAllLabel: 'Select all rows on this page',
  selectRowLabel: (rowKey) => `Select row ${rowKey}`,
  showingCount: ({ showing, total }) => `Showing ${showing} of ${total}`,
  pageCount: ({ page, pageCount, total }) =>
    `Page ${page} of ${pageCount} — ${total} total`,
  selectedCount: (count) => `${count} selected`,
  clearSelection: 'Clear selection',
  emptyNoneTitle: 'Nothing here yet',
  emptyNoneDescription: 'Items appear here as soon as they are created.',
  emptyNoMatchesTitle: 'No matches',
  emptyNoMatchesDescription: 'Nothing matches the current search and filters.',
  errorTitle: 'Could not load this list',
  errorStaleBanner:
    'The latest refresh failed — the rows below are the last ones the server served.',
  errorDescription: 'Something went wrong while loading this list.',
  retry: 'Retry',
  loadingLabel: 'Loading',
};
