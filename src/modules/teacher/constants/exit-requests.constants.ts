/**
 * The pending-exit-requests read's refetch cadence in MILLISECONDS. A student
 * locked in a test is waiting on this answer, so the queue re-polls while the
 * sitting is open — one cadence constant beside the live monitor's own.
 */
export const PENDING_EXIT_REQUESTS_POLL_INTERVAL_MS = 10_000;
