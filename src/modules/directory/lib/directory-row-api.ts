/**
 * teacher/01 — the ONE place a row's identity, its selection state and its
 * gated action lists are derived (U-44, SHARED-LAYER §L-layout).
 *
 * `DirectoryRows` (the `<table>` body) and `DirectoryList` (the `rows`/`cards`/
 * `tiles` body) both consume this; neither derives a key of its own. That is
 * the whole point of the unit: a `<tr>` and a tile that disagreed about `key`,
 * `selected` or `quickActions` would be two kits wearing one name.
 */
// Cross-module, so through the barrel — never `actions/lib/ops-selection`
// directly (rules/module-pattern.md §2). The deep imports of this same symbol
// live INSIDE `ops/actions`, where the same-module rule inverts.
import { selectionKey, type OpsActionTarget } from '@/modules/ops/actions';

import type {
  DirectoryGroupDef,
  DirectoryRowAction,
  DirectoryRowApi,
  DirectorySelectionApi,
} from '../types/directory.types';

/** ops/02's D-KIT-QUICK cap: at most two actions render inline ahead of the ⋯ menu. */
export const DIRECTORY_QUICK_ACTION_MAX = 2;

export interface DirectoryRowApiInput<Row> {
  rows: readonly Row[];
  /** U-11 — row identity. Defaults to `selectionKey(getRowTarget(row))` so no ops surface changes. */
  getRowKey?: (row: Row) => string;
  getRowTarget?: (row: Row) => OpsActionTarget;
  selection: DirectorySelectionApi<Row>;
  rowActions?: (row: Row) => readonly DirectoryRowAction<Row>[];
  groupBy?: DirectoryGroupDef<Row>;
}

/** One row paired with the api `renderRow` (or the `<tr>` renderer) receives. */
export interface DirectoryRowEntry<Row> {
  row: Row;
  api: DirectoryRowApi<Row>;
}

/**
 * A group of rows. Without `groupBy` there is exactly one group whose `heading`
 * is null — so both bodies render the ungrouped case by the same code path as
 * the grouped one, and `last` means the same thing either way.
 */
export interface DirectoryRowGroup<Row> {
  key: string;
  heading: string | null;
  rows: readonly DirectoryRowEntry<Row>[];
}

/**
 * The row-key resolver. `getRowKey` wins; otherwise the key is the selection
 * engine's own `kind:documentId` string (`actions/lib/ops-selection.ts`), which
 * is what every ops surface keys on today.
 *
 * NEVER a display name: two schools can share one, and a name-keyed bulk action
 * addresses the wrong tenant.
 */
export function resolveRowKey<Row>(
  row: Row,
  getRowKey?: (row: Row) => string,
  getRowTarget?: (row: Row) => OpsActionTarget,
): string {
  if (getRowKey) return getRowKey(row);
  if (getRowTarget) return selectionKey(getRowTarget(row));
  throw new Error('directory: a row needs getRowKey, or getRowTarget to derive it from');
}

/**
 * Quick actions: `quick` AND an `icon` (there is nothing to draw without one),
 * capped at two. The menu still lists every action — inline is a shortcut, not
 * a filter.
 */
export function quickActionsOf<Row>(
  actions: readonly DirectoryRowAction<Row>[],
): readonly DirectoryRowAction<Row>[] {
  return actions
    .filter((action) => Boolean(action.quick && action.icon))
    .slice(0, DIRECTORY_QUICK_ACTION_MAX);
}

/**
 * Groups rows for any layout. `order` fixes the sequence; keys it does not name
 * follow it in first-seen order, and the sort is stable in both halves.
 */
function groupRows<Row>(
  rows: readonly Row[],
  groupBy: DirectoryGroupDef<Row>,
): readonly { key: string; rows: Row[] }[] {
  const buckets = new Map<string, Row[]>();
  for (const row of rows) {
    const key = groupBy.key(row);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }

  const seen = [...buckets.keys()];
  const order = groupBy.order ?? [];
  const ranked = seen.map((key, index) => {
    const listed = order.indexOf(key);
    return { key, listed: listed === -1 ? Number.POSITIVE_INFINITY : listed, index };
  });
  ranked.sort((a, b) => (a.listed - b.listed) || (a.index - b.index));

  return ranked.map(({ key }) => ({ key, rows: buckets.get(key) ?? [] }));
}

/**
 * Builds every row's api, grouped. `last` is true on the final row OF ITS
 * GROUP — the design's transparent last-row divider sits at the end of each
 * section, not only at the end of the page.
 */
export function buildDirectoryRowGroups<Row>({
  rows,
  getRowKey,
  getRowTarget,
  selection,
  rowActions,
  groupBy,
}: DirectoryRowApiInput<Row>): readonly DirectoryRowGroup<Row>[] {
  const groups = groupBy
    ? groupRows(rows, groupBy)
    : [{ key: '', rows: [...rows] }];

  return groups.map((group) => ({
    key: group.key,
    heading: groupBy ? groupBy.heading(group.key, group.rows.length) : null,
    rows: group.rows.map((row, index) => {
      const actions = rowActions ? rowActions(row) : [];
      return {
        row,
        api: {
          key: resolveRowKey(row, getRowKey, getRowTarget),
          selected: selection.isSelected(row),
          onToggleSelect: () => selection.toggleRow(row),
          actions,
          quickActions: quickActionsOf(actions),
          last: index === group.rows.length - 1,
        },
      };
    }),
  }));
}
