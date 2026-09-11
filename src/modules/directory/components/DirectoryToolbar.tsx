'use client';

/**
 * Task 02 — the directory toolbar: trimmed-literal search, one select per
 * filter def, the sort select, and Clear filters. The controls are the design
 * system's canonical ones (DS §06 SelectField); every value change goes
 * through the state hook, which owns the URL write and the page reset.
 *
 * teacher/06 — an optional `layoutControl` renders the segmented tiles ⇄ list
 * toggle (U-05's axis made a control): a view choice that changes the BODY and
 * nothing else, written through the same URL-backed state.
 *
 * school-admin/02 — the per-filter loop is gone: the defs render through the
 * ONE §L-filters renderer (`DirectoryFilters`), whose `kind: undefined` arm
 * is the exact SelectField this file used to loop, so every existing consumer
 * renders unchanged while the seven other kinds become available.
 */
import { useId } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, Input, SelectField } from '@/modules/design-system';

import { DIRECTORY_ALL } from '../constants/directory.constants';
import { DirectoryFilters } from './DirectoryFilters';
import type {
  DirectoryFilterDef,
  DirectoryLabels,
  DirectoryLayoutOption,
  DirectorySortDef,
  DirectoryStateApi,
} from '../types/directory.types';

export interface DirectoryLayoutControl {
  value: string;
  onChange: (layout: string) => void;
  options: readonly DirectoryLayoutOption[];
}

interface DirectoryToolbarProps<Row> {
  state: DirectoryStateApi;
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
  labels: DirectoryLabels;
  showing: number;
  total: number;
  layoutControl?: DirectoryLayoutControl;
  /** BUG-004 (ops design): 40px pill selects, hidden labels, Clear beside the
   *  filters, count + sort pill right-aligned. */
  variant?: 'default' | 'pill';
  /** BUG-004 — the surface renders its own search in the page header. */
  search?: boolean;
}

export function DirectoryToolbar<Row>({
  state,
  filters,
  sorts,
  labels,
  showing,
  total,
  layoutControl,
  variant = 'default',
  search = true,
}: DirectoryToolbarProps<Row>) {
  const idPrefix = useId();
  const pill = variant === 'pill';
  const pillTrigger =
    'h-10 min-h-10 w-auto data-[size=default]:h-10 rounded-full border-[1.5px] px-3.5 text-[13.5px] font-medium';

  return (
    <div
      data-slot="directory-toolbar"
      data-variant={variant}
      className={cn(
        'flex flex-wrap justify-between gap-3',
        pill ? 'items-center gap-2.5' : 'items-end',
      )}
    >
      {/* items-end (default variant): the labelled filter shells are ~70px
          tall while the search field is 40px — under the default stretch the
          search's relative wrapper grew to shell height and its absolutely
          positioned icon centered BELOW the input, outside the box. Aligning
          the row to the controls' baseline pins the 40px field beside them. */}
      <div className={cn('flex flex-wrap items-end gap-3', pill && 'items-center gap-2.5')}>
        {search ? (
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={`${idPrefix}-search`}
              aria-label={labels.searchLabel}
              type="search"
              // 40px pill search in BOTH variants — the design's toolbar is one
              // align-items:center row of 40px controls (`Ops Portal.dc.html:91-107`).
              // The canonical Input is h-12 (BUG-003); left at that height the
              // field towered over the 40px selects/chips beside it and the row
              // (items-end under FieldShell labels) read as broken.
              className="h-10 w-64 rounded-full border-transparent pl-9 shadow-sm"
              placeholder={labels.searchPlaceholder}
              value={state.searchInput}
              onChange={(event) => state.setSearchInput(event.target.value)}
            />
          </div>
        ) : null}
        <DirectoryFilters
          filters={filters}
          value={(key) => state.params.filters[key] ?? DIRECTORY_ALL}
          onValueChange={state.setFilter}
          labels={labels}
          idPrefix={idPrefix}
          pill={pill}
        />
        {pill && state.hasActiveControls ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full px-4 text-[13.5px] font-semibold text-blue-600"
            onClick={state.clearFilters}
          >
            {labels.clearFilters}
          </Button>
        ) : null}
        {sorts.length > 0 && !pill ? (
          <SelectField
            id={`${idPrefix}-sort`}
            label={labels.sortLabel}
            placeholder={labels.sortLabel}
            options={sorts.map((option) => ({ value: option.value, label: option.label }))}
            value={state.params.sort}
            onValueChange={(next) => state.setSort(next)}
          />
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {layoutControl ? (
          <div
            role="group"
            aria-label={labels.layoutLabel}
            data-slot="directory-layout-toggle"
            className="flex gap-0.5 rounded-lg bg-surface-inset p-0.5"
          >
            {layoutControl.options.map((option) => {
              const active = option.value === layoutControl.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={active}
                  onClick={() => layoutControl.onChange(option.value)}
                  className={cn(
                    'inline-flex h-8 w-8.5 items-center justify-center rounded-md transition-colors motion-reduce:transition-none',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <option.icon aria-hidden="true" className="size-4" />
                </button>
              );
            })}
          </div>
        ) : null}
        {total > 0 ? (
          <p className={cn('text-sm text-muted-foreground', pill && 'text-[13px]')} role="status">
            {labels.showingCount({ showing, total })}
          </p>
        ) : null}
        {sorts.length > 0 && pill ? (
          <SelectField
            id={`${idPrefix}-sort`}
            label={labels.sortLabel}
            placeholder={labels.sortLabel}
            options={sorts.map((option) => ({ value: option.value, label: option.label }))}
            value={state.params.sort}
            onValueChange={(next) => state.setSort(next)}
            hideLabel
            triggerClassName={pillTrigger}
          />
        ) : null}
        {state.hasActiveControls && !pill ? (
          <Button type="button" variant="outline" size="sm" onClick={state.clearFilters}>
            {labels.clearFilters}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
