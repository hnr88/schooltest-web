'use client';

/**
 * Task 04 — the directory toolbar: trimmed-literal search, one select per
 * filter def, the sort select, and Clear filters. The controls are the design
 * system's canonical ones (DS §06 SelectField); every value change goes
 * through the state hook, which owns the URL write and the page reset.
 */
import { useId } from 'react';
import { Search } from 'lucide-react';

import { Button, SelectField } from '@/modules/design-system';
import { Input } from '@/components/ui/input';

import { DIRECTORY_ALL } from '../constants/ops-directory.constants';
import type {
  DirectoryFilterDef,
  DirectoryLabels,
  DirectorySortDef,
  DirectoryStateApi,
} from '../types/ops-directory.types';

interface OpsDirectoryToolbarProps<Row> {
  state: DirectoryStateApi;
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
  labels: DirectoryLabels;
  showing: number;
  total: number;
}

export function OpsDirectoryToolbar<Row>({
  state,
  filters,
  sorts,
  labels,
  showing,
  total,
}: OpsDirectoryToolbarProps<Row>) {
  const idPrefix = useId();

  return (
    <div
      data-slot="ops-directory-toolbar"
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
        {filters.map((def) => (
          <SelectField
            key={def.key}
            id={`${idPrefix}-filter-${def.key}`}
            label={def.label}
            placeholder={def.label}
            options={def.options.map((option) => ({ value: option.value, label: option.label }))}
            value={state.params.filters[def.key] ?? DIRECTORY_ALL}
            onValueChange={(next) => state.setFilter(def.key, next)}
          />
        ))}
        <SelectField
          id={`${idPrefix}-sort`}
          label={labels.sortLabel}
          placeholder={labels.sortLabel}
          options={sorts.map((option) => ({ value: option.value, label: option.label }))}
          value={state.params.sort}
          onValueChange={(next) => state.setSort(next)}
        />
      </div>
      <div className="flex items-center gap-3">
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
