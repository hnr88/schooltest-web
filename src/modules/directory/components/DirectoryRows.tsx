'use client';

/**
 * Task 02 — the directory table shell: header with sortable column buttons
 * (asc/desc toggle, the server sort value pair decides what is written), the
 * selection column, and body rows with the per-row action menu. The sort tie
 * rule itself is server-side (declared sort + documentId ascending, nulls
 * last) — the client only ever sends one of the declared values.
 *
 * teacher/01 — this is now the `table` arm of the `layout` axis (U-05). Its row
 * identity, selection state and action lists come from `lib/directory-row-api.ts`,
 * the same factory `DirectoryList` uses, so the two bodies cannot disagree. It
 * also gained `groupBy` heading rows and §L-rownav's `rowHref` / `onRowSelect`.
 */
import { Fragment, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, MoreHorizontal, type LucideIcon } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { OpsActionTarget } from '@/modules/ops/actions';
import { IconButton, RowActionsCluster, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { buildDirectoryRowGroups } from '../lib/directory-row-api';
import type {
  DirectoryColumnDef,
  DirectoryGroupDef,
  DirectoryLabels,
  DirectoryMarkupAttrs,
  DirectoryRowAction,
  DirectoryRowApi,
  DirectorySelectionApi,
  DirectoryStateApi,
} from '../types/directory.types';

interface DirectoryRowsProps<Row> {
  state: DirectoryStateApi;
  columns: readonly DirectoryColumnDef<Row>[];
  rows: readonly Row[];
  /** U-11 — optional now; required by the descriptor only while `selectable`. */
  getRowTarget?: (row: Row) => OpsActionTarget;
  /** U-11 — row identity; defaults to `selectionKey(getRowTarget(row))`. */
  getRowKey?: (row: Row) => string;
  selectable: boolean;
  selection: DirectorySelectionApi<Row>;
  rowActions?: (row: Row) => readonly DirectoryRowAction<Row>[];
  labels: DirectoryLabels;
  /** U-05 — a full-width heading row per group, in this layout. */
  groupBy?: DirectoryGroupDef<Row>;
  /** U-44 — the first cell becomes the anchor; the rest of the row is not clickable. */
  rowHref?: (row: Row) => string;
  /** U-44 — for a row that opens a panel rather than navigating. Never `onClick` on the `<tr>`. */
  onRowSelect?: (row: Row) => void;
  /** U-17 — pin the header row to the region's scrollport (`sticky top-0`). */
  sticky?: boolean;
  /** ops/34 — the surface's per-row markers (`data-*` slot/status), merged onto each body row. */
  rowAttrs?: (row: Row) => DirectoryMarkupAttrs<HTMLTableRowElement>;
}

export function DirectoryRows<Row>({
  state,
  columns,
  rows,
  getRowTarget,
  getRowKey,
  selectable,
  selection,
  rowActions,
  labels,
  groupBy,
  rowHref,
  onRowSelect,
  sticky = false,
  rowAttrs,
}: DirectoryRowsProps<Row>) {
  const leading = selectable ? 1 : 0;
  const trailing = rowActions ? 1 : 0;
  const colSpan = columns.length + leading + trailing;

  const groups = buildDirectoryRowGroups({
    rows,
    getRowKey,
    getRowTarget,
    selection,
    rowActions,
    groupBy,
  });

  // Flat row index per group, for §L-a11y A5's `data-directory-row-index` —
  // DirectoryTable's row-removal focus lands on the nearest survivor by it.
  const groupOffsets = new Map<string, number>();
  let running = 0;
  for (const group of groups) {
    groupOffsets.set(group.key, running);
    running += group.rows.length;
  }

  return (
    <Table>
      {/* ops/34 — the sticky recipe pins the THEAD, not the <tr>: sticky on a
          table row inside a collapsed-border table does not hold, and the
          proven pre-kit pattern (`PastSessionsTable`'s old header) stuck the
          THEAD itself. The header row keeps its own classes for the visual
          state; the pin lives here where the scrollport is chosen. */}
      <TableHeader className={sticky ? 'sticky top-0 z-10 bg-card' : undefined}>
        <TableRow
          data-sticky={sticky || undefined}
        >
          {selectable ? (
            <TableHead className="w-10">
              <Checkbox
                aria-label={labels.selectAllLabel}
                checked={selection.headerState === 'all'}
                onCheckedChange={() => selection.toggleAllOnPage()}
              />
            </TableHead>
          ) : null}
          {columns.map((column) => (
            <TableHead key={column.key} className={column.className} aria-sort={ariaSortOf(state, column)}>
              {column.sortable && column.sortValues ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort(state, column)}
                >
                  {column.header}
                  {state.params.sort === column.sortValues.asc ? <ArrowUp className="size-3.5" /> : null}
                  {state.params.sort === column.sortValues.desc ? <ArrowDown className="size-3.5" /> : null}
                </button>
              ) : (
                column.header
              )}
            </TableHead>
          ))}
          {rowActions ? <TableHead className="w-12">
            <span className="sr-only">{labels.rowMenuLabel}</span>
          </TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <Fragment key={group.key}>
            {group.heading === null ? null : (
              <TableRow data-slot="directory-group-heading">
                <TableCell colSpan={colSpan} className="bg-muted/50 text-sm font-medium text-muted-foreground">
                  {group.heading}
                </TableCell>
              </TableRow>
            )}
            {group.rows.map(({ row, api }, indexInGroup) => (
              <TableRow
                key={api.key}
                data-selected={api.selected || undefined}
                data-last={api.last || undefined}
                data-directory-row
                data-directory-row-index={(groupOffsets.get(group.key) ?? 0) + indexInGroup}
                {...rowAttrs?.(row)}
              >
                {selectable ? (
                  <TableCell>
                    <Checkbox
                      aria-label={labels.selectRowLabel(api.key)}
                      checked={api.selected}
                      onCheckedChange={() => api.onToggleSelect()}
                    />
                  </TableCell>
                ) : null}
                {columns.map((column, columnIndex) => (
                  <TableCell key={column.key} className={column.className}>
                    {columnIndex === 0 ? (
                      <FirstCell row={row} rowHref={rowHref} onRowSelect={onRowSelect}>
                        {column.cell(row)}
                      </FirstCell>
                    ) : (
                      column.cell(row)
                    )}
                  </TableCell>
                ))}
                {rowActions ? (
                  <TableCell data-directory-row-menu>
                    <RowActions api={api} row={row} labels={labels} />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
/**
 * §L-rownav. The whole-row link is the FIRST cell's content as an `<a>`, never
 * `after:absolute after:inset-0` on a row that also carries a menu — that shape
 * is the nested-interactive failure axe reports, and it is the defect this
 * replaces rather than the pattern to copy. `rowActions` stay outside the link.
 */
function FirstCell<Row>({
  row,
  rowHref,
  onRowSelect,
  children,
}: {
  row: Row;
  rowHref?: (row: Row) => string;
  onRowSelect?: (row: Row) => void;
  children: ReactNode;
}) {
  if (rowHref) {
    return (
      <Link href={rowHref(row)} data-row-href className="hover:underline">
        {children}
      </Link>
    );
  }
  if (onRowSelect) {
    return (
      <button type="button" data-row-select className="text-left hover:underline" onClick={() => onRowSelect(row)}>
        {children}
      </button>
    );
  }
  return <>{children}</>;
}

function toggleSort<Row>(state: DirectoryStateApi, column: DirectoryColumnDef<Row>): void {
  if (!column.sortValues) return;
  state.setSort(state.params.sort === column.sortValues.asc ? column.sortValues.desc : column.sortValues.asc);
}

function ariaSortOf<Row>(
  state: DirectoryStateApi,
  column: DirectoryColumnDef<Row>,
): 'ascending' | 'descending' | undefined {
  if (!column.sortValues) return undefined;
  if (state.params.sort === column.sortValues.asc) return 'ascending';
  if (state.params.sort === column.sortValues.desc) return 'descending';
  return undefined;
}

interface RowMenuProps<Row> {
  actions: readonly DirectoryRowAction<Row>[];
  row: Row;
  labels: DirectoryLabels;
}

type QuickRowAction<Row> = DirectoryRowAction<Row> & { icon: LucideIcon };

/**
 * Up to two `quick` actions render inline as icon buttons ahead of the menu;
 * the menu still lists every action, so inline is a shortcut, not a filter.
 * `quick` without `icon` is menu-only (there is nothing to draw).
 *
 * teacher/01: both lists now arrive on `DirectoryRowApi`, derived by
 * `lib/directory-row-api.ts` — the cap is applied in one place for every layout.
 */
function RowActions<Row>({ api, row, labels }: { api: DirectoryRowApi<Row>; row: Row; labels: DirectoryLabels }) {
  if (api.actions.length === 0) return null;
  const quick = api.quickActions.filter((action): action is QuickRowAction<Row> => Boolean(action.icon));
  if (quick.length === 0) return <RowMenu actions={api.actions} row={row} labels={labels} />;
  return (
    <RowActionsCluster>
      {quick.map((action) => (
        <IconButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          size="sm"
          tone={action.destructive ? 'danger' : undefined}
          // ops/28 (D-53) — visual-only: `aria-disabled` + a muted class, not
          // the native `disabled` attribute, so `onSelect` still runs and a
          // write-gated action's refusal toast still fires (D-31). See
          // DirectoryRowAction.disabled.
          aria-disabled={action.disabled === true || undefined}
          className={action.disabled ? 'opacity-50' : undefined}
          onClick={() => action.onSelect(row)}
        />
      ))}
      <RowMenu actions={api.actions} row={row} labels={labels} />
    </RowActionsCluster>
  );
}

function RowMenu<Row>({ actions, row, labels }: RowMenuProps<Row>) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton icon={MoreHorizontal} label={labels.rowMenuLabel} size="sm" />}
      />
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            // ops/28 (D-53) — `disabled` greys the item via `aria-disabled`,
            // never the native `disabled` prop (or a `data-disabled` attr —
            // `DropdownMenuItem`'s own class list already wires
            // `data-disabled:pointer-events-none`, which would block the
            // click below just as the native prop would). See
            // DirectoryRowAction.disabled for why that click must stay live.
            aria-disabled={action.disabled === true || undefined}
            className={
              action.disabled
                ? 'text-muted-foreground'
                : action.destructive
                  ? 'text-destructive'
                  : undefined
            }
            // onClick, NOT onSelect: this is Base UI's Menu.Item, which has no
            // onSelect prop — that is Radix's API. React binds the name as the
            // DOM text-selection event instead, so the handler sat silent
            // through every click (menu opens, item "activates", nothing
            // runs, no error) — the schools table's dead "Open school" was
            // this, not the router.
            onClick={() => action.onSelect(row)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
