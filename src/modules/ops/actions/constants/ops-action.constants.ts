/**
 * Bounds the runner enforces (task 05).
 *
 * The selection cap is a page-scoped cap, not a dataset cap: "select all" means
 * the rows on screen, so a bulk action can never quietly address a tenant.
 */
export const OPS_SELECTION_MAX = 200;

/** Concurrent single-item writes. Bounded so a bulk run cannot flood the API. */
export const OPS_ACTION_MAX_IN_FLIGHT = 3;

/** Fallback when a download response carries no usable Content-Disposition. */
export const OPS_DOWNLOAD_FALLBACK_FILENAME = 'download';
