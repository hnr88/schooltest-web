'use client';

/**
 * Task 04 — the directory table shell: header with sortable column buttons
 * (asc/desc toggle, the server sort value pair decides what is written), the
 * selection column, and body rows with the per-row action menu. The sort tie
 * rule itself is server-side (declared sort + documentId ascending, nulls
 * last) — the client only ever sends one of the declared values.
 */
import { ArrowDown, ArrowUp, MoreHorizontal } from 'lucide-react';

import { IconButton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type {
  DirectoryColumnDef,
  DirectoryLabels,
  DirectoryRowAction,
  DirectoryStateApi,
  OpsDirectorySelectionApi,
} from '../types/ops-directory.types';

interface OpsDirectoryRowsProps<Row> {
  state: DirectoryStateApi;
  columns: readonly DirectoryColumnDef<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  selectable: boolean;
  selection: OpsDirectorySelectionApi;
  rowActions?: (row: Row) => readonly DirectoryRowAction<Row>[];
  labels: DirectoryLabels;
}

export function OpsDirectoryRows<Row>({
  state,
  columns,
  rows,
  getRowKey,
  selectable,
  selection,
  rowActions,
  labels,
}: OpsDirectoryRowsProps<Row>) {
  const leading = selectable ? 1 : 0;
  const trailing = rowActions ? 1 : 0;
  const colSpan = columns.length + leading + trailing;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable ? (
            <TableHead className="w-10">
              <Checkbox
                aria-label={labels.selectAllLabel}
                checked={selection.allOnPageSelected}
                onCheckedChange={() => selection.togglePage()}
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
        {rows.map((row) => {
          const key = getRowKey(row);
          return (
            <TableRow key={key} data-selected={selection.isSelected(key) || undefined}>
              {selectable ? (
                <TableCell>
                  <Checkbox
                    aria-label={labels.selectRowLabel(key)}
                    checked={selection.isSelected(key)}
                    onCheckedChange={() => selection.toggleRow(key)}
                  />
                </TableCell>
              ) : null}
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
              {rowActions ? (
                <TableCell>
                  <RowMenu actions={rowActions(row)} row={row} labels={labels} />
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
              {labels.emptyNoMatchesTitle}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
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
            className={action.destructive ? 'text-destructive' : undefined}
            onSelect={() => action.onSelect(row)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
