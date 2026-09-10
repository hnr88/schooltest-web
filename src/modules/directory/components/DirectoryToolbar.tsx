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
import { Button, SelectField } from '@/modules/design-system';
import { Input } from '@/components/ui/input';

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
}

export function DirectoryToolbar<Row>({
  state,
  filters,
  sorts,
  labels,
  showing,
  total,
  layoutControl,
}: DirectoryToolbarProps<Row>) {
  const idPrefix = useId();

  return (
    <div
      data-slot="directory-toolbar"
      className="flex flex-wrap items-end justify-between gap-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={`${idPrefix}-search`}
            aria-label={labels.searchLabel}
            type="search"
            className="w-64 pl-9"
            placeholder={labels.searchPlaceholder}
            value={state.searchInput}
            onChange={(event) => state.setSearchInput(event.target.value)}
          />
        </div>
        <DirectoryFilters
          filters={filters}
          value={(key) => state.params.filters[key] ?? DIRECTORY_ALL}
          onValueChange={state.setFilter}
          labels={labels}
          idPrefix={idPrefix}
        />
        {sorts.length > 0 ? (
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
          <p className="text-sm text-muted-foreground" role="status">
            {labels.showingCount({ showing, total })}
          </p>
        ) : null}
        {state.hasActiveControls ? (
          <Button type="button" variant="outline" size="sm" onClick={state.clearFilters}>
            {labels.clearFilters}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
