/**
 * Task 02 — the `client` mode reducer (D-KIT-MODE), pure and generic.
 *
 * The consumer loads the whole array once (the four school-scoped endpoints
 * serve no filter params — D-27) and this function applies exactly what the
 * server would have: `q` against the consumer's searchable text, each active
 * filter through the consumer's predicate, the sort comparator, then the page
 * window. The synthesised meta reports the FILTERED total, and an out-of-range
 * page clamps to the last one — where `server` mode deliberately lets the
 * endpoint answer 400 instead.
 */
import { clampPage } from './directory-url';
import type {
  DirectoryClientConfig,
  DirectoryClientResult,
  DirectoryMeta,
  DirectoryQueryParams,
} from '../types/directory.types';

export function applyClientDirectoryMode<Row>(
  rows: readonly Row[],
  params: DirectoryQueryParams,
  config: DirectoryClientConfig<Row>,
): DirectoryClientResult<Row> {
  let result: readonly Row[] = rows;

  const q = params.q?.toLowerCase();
  if (q && config.searchText) {
    const searchText = config.searchText;
    result = result.filter((row) =>
      searchText(row).some((field) => field.toLowerCase().includes(q)),
    );
  }

  for (const [key, value] of Object.entries(params.filters)) {
    const predicate = config.filterPredicates?.[key];
    if (predicate) result = result.filter((row) => predicate(row, value));
  }

  const comparator = config.comparators?.[params.sort];
  if (comparator) result = [...result].sort(comparator);

  const total = result.length;
  // ops/34 — `variant: 'none'` (useDirectoryState) arrives as an infinite
  // pageSize: one page carrying the WHOLE loaded array, the pager never
  // rendered. Math.ceil(total / Infinity) would read 0, so the unbounded arm
  // states its own meta: a single page whenever the array is non-empty.
  const pageCount = Number.isFinite(params.pageSize)
    ? Math.ceil(total / params.pageSize)
    : total === 0
      ? 0
      : 1;
  const page = pageCount === 0 ? 1 : clampPage(params.page, pageCount);
  // `(page - 1) * Infinity` is NaN, and `slice(NaN, NaN)` returns [] — the
  // unbounded arm must state its own window start instead of multiplying.
  const start =
    params.pageSize === Number.POSITIVE_INFINITY ? 0 : (page - 1) * params.pageSize;
  const meta: DirectoryMeta = { page, pageSize: params.pageSize, pageCount, total };

  return { rows: result.slice(start, start + params.pageSize), meta };
}
