/**
 * teacher/04 — the ten-arm body machine's pure decision (U-13, U-46;
 * SHARED-LAYER §L-states). `DirectoryTable` renders ONLY what this function
 * returns: the arms are a lookup, not a ladder of `if`s scattered in JSX.
 *
 * First match wins, in §L-states' order:
 *
 *   0. enabled === false                        -> 'disabled'          the surface's own gate, NOT Loading
 *   1. isPending                                -> 'loading'           role=status, 5 skeleton rows
 *   2. isError && kind === 'forbidden'          -> 'restricted'        QueryErrorFallback forbidden arm
 *   3. isError && kind === 'gone'               -> 'gone'              QueryErrorFallback gone arm
 *   4. isError && !hasData                      -> 'loadError'         Error + Retry
 *   5. isError && hasData                       -> 'stale'             stale banner ABOVE the rows
 *   6. no data && hasActiveControls             -> 'empty-no-matches'  Clear filters
 *   7. no data                                  -> 'empty-none'        emptyAction
 *   8. otherwise                                -> rows: 'slow' only for
 *      isFetching && !isPlaceholderData && !polled (§L-stale-vs-loading
 *      case 3), otherwise 'happy'.
 *
 * R-13 makes `hasData` (rows OR total) the gate that outranks `total` alone:
 * a bare-`{data}` consumer with rows and no `meta` renders its rows, never
 * "Nothing here yet". §L-stale-vs-loading cases 2 and 4 are NOT scenarios —
 * placeholder and polled rows stay `happy`; they are affordances
 * (`aria-busy`) the table reads from the same `DirectoryQueryStatus`.
 *
 * This module is domain-free: it imports the classifier, not axios.
 */
import { classifyQueryError } from '@/modules/query-errors';

/** The ten §7 scenarios every kit list can be in. */
export type ListScenario =
  | 'happy'
  | 'loading'
  | 'slow'
  | 'empty-none'
  | 'empty-no-matches'
  | 'stale'
  | 'loadError'
  | 'restricted'
  | 'gone'
  | 'disabled';

export interface ListScenarioInput {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  /** The raw query error; truthiness decides whether the classifier runs. */
  error: unknown;
  /** U-46 — false => the query never ran; NOT loading (§L-states arm 0). */
  enabled: boolean;
  /** U-46 — rows belong to the PREVIOUS params (§L-stale-vs-loading case 2). */
  isPlaceholderData: boolean;
  /** U-46 — a background refetchInterval, never a user-triggered one. */
  polled: boolean;
  rowCount: number;
  total: number;
  hasActiveControls: boolean;
}

export function listScenarioOf(input: ListScenarioInput): ListScenario {
  if (!input.enabled) return 'disabled';
  if (input.isPending) return 'loading';

  const kind = input.error ? classifyQueryError(input.error).kind : null;
  const hasData = input.rowCount > 0 || input.total > 0;

  if (input.isError && kind === 'forbidden') return 'restricted';
  if (input.isError && kind === 'gone') return 'gone';
  if (input.isError) return hasData ? 'stale' : 'loadError';

  if (input.rowCount === 0 && input.total === 0) {
    return input.hasActiveControls ? 'empty-no-matches' : 'empty-none';
  }

  return input.isFetching && !input.isPlaceholderData && !input.polled ? 'slow' : 'happy';
}
