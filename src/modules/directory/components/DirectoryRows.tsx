'use client';

/**
 * ops grid — the `table` layout arm rebuilt as the design's data grid
 * (`Ops Portal.dc.html:155-186`): no `<table>` and no column-header row, just
 * flex rows inside the white card with the columns labelled inline (each metric
 * block carries its own sublabel). Row identity, selection and action lists
 * still come from `lib/directory-row-api.ts`, and the §L-rownav / §L-a11y
 * scaffolding (`data-directory-row*`, first-cell anchor) is unchanged — only
 * the element shape moved. Sort lives in the toolbar's select.
 */
import { Fragment, type MouseEvent, type ReactNode } from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Link, useRouter } from '@/i18n/navigation';
import type { OpsActionTarget } from '@/modules/ops/actions';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  RowActionsCluster,
} from '@/modules/design-system';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

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

const CHECKBOX_GRID_CLASS = 'size-5 rounded-[6px] border-[1.5px] [&_svg]:size-3';

interface DirectoryRowsProps<Row> {
  /** Kept for the descriptor contract; sorting lives in the toolbar's select. */
  state?: DirectoryStateApi;
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
  /** U-05 — a heading row per group, rendered as a full-width label row. */
  groupBy?: DirectoryGroupDef<Row>;
  /** U-44 — the whole row navigates; the click never fires from a control. */
  rowHref?: (row: Row) => string;
  /** U-44 — for a row that opens a panel rather than navigating. */
  onRowSelect?: (row: Row) => void;
  /** Kept for the descriptor contract; the card itself is the scrollport. */
  sticky?: boolean;
  /** ops/34 — the surface's per-row markers (`data-*` slot/status), merged onto each row. */
  rowAttrs?: (row: Row) => DirectoryMarkupAttrs<HTMLDivElement>;
}

export function DirectoryRows<Row>({
  state: _state,
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
  rowAttrs,
}: DirectoryRowsProps<Row>) {
  const router = useRouter();

  // BUG-005 — clicking anywhere on a row is its PRIMARY action; the click is
  // dropped when it landed inside a real interactive element.
  const onRowClick = (row: Row) => (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    if ((event.target as HTMLElement).closest('a,button,input,label,[role="menuitem"]')) return;
    if (rowHref) {
      router.push(rowHref(row));
      return;
    }
    onRowSelect?.(row);
  };
  const rowClickable = rowHref !== undefined || onRowSelect !== undefined;

  const groups = buildDirectoryRowGroups({
    rows,
    getRowKey,
    getRowTarget,
    selection,
    rowActions,
    groupBy,
  });

  const groupOffsets = new Map<string, number>();
  let running = 0;
  for (const group of groups) {
    groupOffsets.set(group.key, running);
    running += group.rows.length;
  }

  return (
    <div data-slot="directory-rows" className="px-6 pt-1.5 pb-1">
      {groups.map((group) => (
        <Fragment key={group.key}>
          {group.heading === null ? null : (
            <div className="px-2.5 pt-4 pb-1 text-sm font-medium text-muted-foreground">
              {group.heading}
            </div>
          )}
          {group.rows.map(({ row, api }, indexInGroup) => (
            <div
              key={api.key}
              data-selected={api.selected || undefined}
              data-last={api.last || undefined}
              data-directory-row
              data-directory-row-index={(groupOffsets.get(group.key) ?? 0) + indexInGroup}
              onClick={rowClickable ? onRowClick(row) : undefined}
              className={cn(
                'flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-[10px] border-b border-[#EEF1F6] px-2.5 py-[18px] hover:bg-[#F8FAFF]',
                indexInGroup === group.rows.length - 1 ? 'border-b-0' : null,
                rowClickable ? 'cursor-pointer' : undefined,
              )}
              {...rowAttrs?.(row)}
            >
              {selectable ? (
                <Checkbox
                  aria-label={labels.selectRowLabel(api.key)}
                  checked={api.selected}
                  onCheckedChange={() => api.onToggleSelect()}
                  className={cn('flex-none', CHECKBOX_GRID_CLASS)}
                />
              ) : null}
              {columns.map((column, columnIndex) => (
                <ColumnBlock
                  key={column.key}
                  column={column}
                  columnIndex={columnIndex}
                  row={row}
                  rowHref={rowHref}
                  onRowSelect={onRowSelect}
                />
              ))}
              {rowActions ? (
                <div data-directory-row-menu className="relative ms-auto flex flex-none items-center">
                  <RowActions api={api} row={row} labels={labels} />
                </div>
              ) : null}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

/** First column defaults to the title block, the rest to metric blocks. */
function ColumnBlock<Row>({
  column,
  columnIndex,
  row,
  rowHref,
  onRowSelect,
}: {
  column: DirectoryColumnDef<Row>;
  columnIndex: number;
  row: Row;
  rowHref?: (row: Row) => string;
  onRowSelect?: (row: Row) => void;
}) {
  const kind = column.grid ?? (columnIndex === 0 ? 'title' : 'metric');
  if (kind === 'bare') {
    return <div className={cn('flex-none', column.className)}>{column.cell(row)}</div>;
  }
  if (kind === 'title') {
    return (
      <div className={cn('min-w-[140px] flex-[3_1_200px] overflow-hidden', column.className)}>
        <FirstCell row={row} rowHref={rowHref} onRowSelect={onRowSelect}>
          {column.cell(row)}
        </FirstCell>
      </div>
    );
  }
  if (kind === 'text') {
    // The tab-table's text column (`Ops Portal.dc.html:398-400`): one 13px
    // line, no sublabel, ellipsised — it SHRINKS and TRUNCATES instead of
    // forcing the row to wrap around its longest word (an email or a UUID
    // fixture string was pushing whole rows onto two scattered lines).
    return (
      <div className={cn('min-w-[80px] flex-[1_1_100px] overflow-hidden', column.className)}>
        <div className="truncate text-[13px] leading-5 text-[#3D4A5C]">{column.cell(row)}</div>
      </div>
    );
  }
  return (
    <div className={cn('min-w-[56px] flex-[1_1_80px] overflow-hidden', column.className)}>
      <div className="truncate text-sm font-semibold text-foreground">{column.cell(row)}</div>
      <div className="mt-0.5 truncate text-xs lowercase text-[#9AA6B8]">{column.header}</div>
    </div>
  );
}

/**
 * §L-rownav. The whole-row link is the FIRST block's content as an `<a>`, never
 * an overlay on a row that also carries a menu. `rowActions` stay outside the link.
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
      <Link href={rowHref(row)} data-row-href className="block hover:underline">
        {children}
      </Link>
    );
  }
  if (onRowSelect) {
    return (
      <button type="button" data-row-select className="block text-left hover:underline" onClick={() => onRowSelect(row)}>
        {children}
      </button>
    );
  }
  return <>{children}</>;
}

interface RowMenuProps<Row> {
  actions: readonly DirectoryRowAction<Row>[];
  row: Row;
  labels: DirectoryLabels;
}

type QuickRowAction<Row> = DirectoryRowAction<Row> & { icon: LucideIcon };

/** Up to two `quick` actions render inline ahead of the ⋯ menu; the menu lists every action. */
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
          // ops/28 (D-53) — visual-only disable so `onSelect` still runs.
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
        render={
          <button
            type="button"
            aria-label={labels.rowMenuLabel}
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-transparent text-[#3D4A5C] transition-colors hover:bg-[#EEF1F6]"
          >
            <MoreHorizontal className="size-[18px]" aria-hidden="true" />
          </button>
        }
      />
      {/* pixel-audit 2026-09-11 — the row menu is the design's 224px/radius-16
          panel (`Ops Portal.dc.html:404`; the kit wrapper owns the radius). */}
      <DropdownMenuContent align="end" className="w-[224px]">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            // ops/28 (D-53) — `aria-disabled` greys the item but keeps the
            // click live so a write-gated action's refusal toast still fires.
            aria-disabled={action.disabled === true || undefined}
            className={
              action.disabled
                ? 'text-muted-foreground'
                : action.destructive
                  ? 'text-destructive'
                  : undefined
            }
            // onClick, NOT onSelect: this is Base UI's Menu.Item, which has no
            // onSelect prop — React would bind the text-selection event instead
            // and the handler would sit silent through every click.
            onClick={() => action.onSelect(row)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
