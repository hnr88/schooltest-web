'use client';

/**
 * teacher/01 — the non-`<table>` body (U-05, SHARED-LAYER §L-layout).
 *
 * `DirectoryRows` renders the `table` layout; this renders the other three.
 * Everything around the body — toolbar, filters, sort, pager, states, URL sync,
 * selection, bulk bar — is identical in every layout, which is the point of the
 * axis. This file therefore knows about exactly two things: the element shape,
 * and the grouping headings.
 *
 * It deliberately holds NO `colSpan` arithmetic. `colSpan = columns.length +
 * leading + trailing` (`DirectoryRows.tsx`) is table-only; leaking it in here is
 * how the empty and loading arms end up rendering a `<td>` outside a table.
 */
import type { ReactNode } from 'react';

import type { DirectoryRowGroup } from '../lib/directory-row-api';
import type { DirectoryLayout, DirectoryRowApi } from '../types/directory.types';

/** The three non-table layouts. `table` never reaches this component. */
export type DirectoryListLayout = Exclude<DirectoryLayout, 'table'>;

interface DirectoryListProps<Row> {
  layout: DirectoryListLayout;
  groups: readonly DirectoryRowGroup<Row>[];
  renderRow: (row: Row, api: DirectoryRowApi<Row>) => ReactNode;
  /**
   * §L-rownav: in a non-table layout `renderRow` owns its own anchor, so
   * `rowHref` is ignored here and warned about in dev. Accepting it silently is
   * how a tile grid ends up unclickable with nothing in the console.
   */
  rowHref?: (row: Row) => string;
}

/**
 * `role="list"` is explicit on purpose: Safari drops the implicit list role the
 * moment `list-style: none` is set, and every grid track below sets it.
 *
 * The kit emits no `role="listbox"` in any layout — a surface that needs one
 * supplies it through `renderRow`.
 */
const LAYOUT_CLASS: Record<DirectoryListLayout, string> = {
  // The design's row list (`Teacher Portal v2.dc.html:167-212`): the same
  // records as the table, stacked, 12px apart.
  rows: 'flex flex-col gap-3',
  // The live roster's cards (`:1158-1206`), 250px floor.
  cards: 'grid grid-cols-directory-cards gap-3.5',
  // The class tiles (`:118-165`), 288px floor, 14px gutter.
  tiles: 'grid grid-cols-directory-tiles gap-3.5',
};

export function DirectoryList<Row>({
  layout,
  groups,
  renderRow,
  rowHref,
}: DirectoryListProps<Row>) {
  if (process.env.NODE_ENV !== 'production' && rowHref) {
    // Dev-only diagnostic (§L-rownav row 4). `no-console` is not configured in
    // this repo — `query-errors/hooks/useQueryErrorReport.ts:19` reports the
    // same way — so this needs no suppression, and law 6 forbids adding one.
    console.warn(
      `directory: \`rowHref\` is ignored in layout "${layout}" — renderRow owns its own anchor (SHARED-LAYER §L-rownav).`,
    );
  }

  const grouped = groups.length > 1 || groups.some((group) => group.heading !== null);

  if (!grouped) {
    const only = groups[0];
    return <DirectoryListTrack layout={layout} group={only} renderRow={renderRow} />;
  }

  return (
    <div data-slot="directory-list" className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          {group.heading === null ? null : (
            <h3 className="text-sm font-medium text-muted-foreground">{group.heading}</h3>
          )}
          <DirectoryListTrack layout={layout} group={group} renderRow={renderRow} />
        </section>
      ))}
    </div>
  );
}

function DirectoryListTrack<Row>({
  layout,
  group,
  renderRow,
}: {
  layout: DirectoryListLayout;
  group: DirectoryRowGroup<Row> | undefined;
  renderRow: (row: Row, api: DirectoryRowApi<Row>) => ReactNode;
}) {
  return (
    <ul role="list" data-slot="directory-list-track" data-layout={layout} className={LAYOUT_CLASS[layout]}>
      {(group?.rows ?? []).map((entry) => (
        <li key={entry.api.key} data-last={entry.api.last || undefined}>
          {renderRow(entry.row, entry.api)}
        </li>
      ))}
    </ul>
  );
}
