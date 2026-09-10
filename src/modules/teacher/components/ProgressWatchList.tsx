'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  DirectoryTable,
  applyClientDirectoryMode,
  useDirectoryState,
  type DirectoryLabels,
  type DirectoryQueryStatus,
  type DirectorySortDef,
} from '@/modules/directory';
import { ProgressMoverRow } from '@/modules/teacher/components/ProgressMoverRow';
import type { ProgressWatchListProps } from '@/modules/teacher/types/class-analytics.types';

// One ranked list of the Progress tab (task 34, dashboard §3) now rendered by
// the shared directory kit in `rows` layout (ops/34): search by student, a
// sort whose default `reason` value carries NO comparator — so it shows the
// pure layer's own ranking, which IS the watch reason — plus a name sort. It
// is a read list: no selection, no bulk bar, no row actions.
//
// An empty array is stated in words — the kit's empty arm renders the same
// per-variant copy this list always used, never a swallowed error and never a
// gap filled to make the list look inhabited.
//
// The Progress tab hosts TWO kit lists (gains + support), so this instance
// writes its own prefixed slice of the query string (`watch-gains-q=`…).
const NO_OP_QUERY: DirectoryQueryStatus = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

function ProgressWatchList({ variant, rows }: ProgressWatchListProps) {
  const t = useTranslations('Teacher.results.progress');

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'reason', label: t(variant === 'gains' ? 'mostImproved' : 'needsAttention') },
      { value: 'name:asc', label: t('sortNameA2z') },
    ],
    [t, variant],
  );

  // The Progress tab hosts TWO kit lists (gains + support), so this instance
  // writes its own prefixed slice of the query string (`watch-gains-q=`…) AND
  // names its sibling's keys in `preserveParams` — prefixing alone solves name
  // collision, but each write builds a fresh query string, so without the
  // preserve list interacting with one list would silently reset the other.
  const prefix = variant === 'gains' ? 'watch-gains-' : 'watch-support-';
  const siblingPrefix = variant === 'gains' ? 'watch-support-' : 'watch-gains-';

  const state = useDirectoryState({
    filters: [],
    sorts,
    defaultSort: 'reason',
    mode: 'client',
    paramPrefix: prefix,
    preserveParams: [`${siblingPrefix}q`, `${siblingPrefix}sort`, `${siblingPrefix}page`],
  });

  const client = applyClientDirectoryMode(rows, state.params, {
    searchText: (row) => [row.student.name],
    comparators: {
      'name:asc': (a, b) => a.student.name.localeCompare(b.student.name),
    },
  });

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      sortLabel: t('sortLabel'),
      clearFilters: t('clearFilters'),
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount: pages }) => t('pageCount', { page, pageCount: pages }),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      emptyNoneTitle: t(variant === 'gains' ? 'topGainsEmpty' : 'needsSupportEmpty'),
      emptyNoneDescription: t(variant === 'gains' ? 'gainsEmptyHint' : 'supportEmptyHint'),
      loadingLabel: t('loadingLabel'),
      errorTitle: t('errorTitle'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
    }),
    [t, variant],
  );

  return (
    <div
      data-slot="progress-watch-list"
      data-variant={variant}
      aria-labelledby={`progress-watch-${variant}`}
      role="group"
      className="flex flex-col gap-2"
    >
      <h3 id={`progress-watch-${variant}`} className="text-base font-semibold text-foreground">
        {t(variant === 'gains' ? 'topGainsTitle' : 'needsSupportTitle')}
      </h3>

      <DirectoryTable
        state={state}
        query={NO_OP_QUERY}
        rows={client.rows}
        meta={client.meta}
        filters={[]}
        sorts={sorts}
        pagination="none"
        layout="rows"
        renderRow={(row) => <ProgressMoverRow row={row} />}
        getRowKey={(row) => row.student.document_id}
        labels={labels}
      />

      {variant === 'support' && rows.length > 0 ? (
        <p className="text-meta text-balance text-muted-foreground">{t('needsAttentionNote')}</p>
      ) : null}
    </div>
  );
}

export { ProgressWatchList };
