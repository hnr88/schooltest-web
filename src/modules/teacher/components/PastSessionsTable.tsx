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
import {
  PAST_SESSIONS_DEFAULT_SORT,
  pastSessionsClientConfig,
} from '@/modules/teacher/lib/past-sessions-directory';
import { usePastSessionsColumns } from '@/modules/teacher/hooks/usePastSessionsColumns';
import type { PastSessionsTableProps } from '@/modules/teacher/types/past-sessions.types';

/**
 * ops/34 — the past-sessions list on the shared directory kit, `client` mode
 * (D-KIT-MODE): the panel's two reads (C-TS-2 rows, C-TD-2 labels) arrive as
 * arrays plus one composed `DirectoryQueryStatus`, and the kit owns search,
 * sort, pagination and every state. `sticky` gives the body the SAME focusable
 * `max-h-96` scroll region the retired bespoke scroller provided, and
 * `regionAttrs`/`rowAttrs` carry the aria label and the row markers its specs
 * assert (the retired bespoke scroller's contract, `past-session-row`).
 */
function PastSessionsTable({ sessions, tests, queryStatus }: PastSessionsTableProps) {
  const t = useTranslations('Teacher.testSessions.pastSessions');

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'date:desc', label: t('sortDateNewest') },
      { value: 'date:asc', label: t('sortDateOldest') },
      { value: 'status:open', label: t('sortStatusLiveFirst') },
      { value: 'status:closed', label: t('sortStatusClosedFirst') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters: [],
    sorts,
    defaultSort: PAST_SESSIONS_DEFAULT_SORT,
    mode: 'client',
    // C-TS-2 is an UNBOUNDED history: the page renders ALL of it in the sticky
    // scroller, exactly as the pre-kit table did — the history is never
    // truncated behind a pager. The kit's `variant: 'none'` (ops/34) is that
    // idiom proper: the clamped `pageSize: DIRECTORY_PAGE_SIZE_MAX` it replaced
    // silently truncated the history behind "Page 1 of 2" the moment this
    // instance outgrew 200 sittings.
    pagination: { variant: 'none' },
  });

  const client = applyClientDirectoryMode(sessions, state.params, pastSessionsClientConfig(tests));
  const columns = usePastSessionsColumns(tests);

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
      emptyNoneTitle: t('emptyTitle'),
      emptyNoneDescription: t('emptyDescription'),
      emptyNoMatchesTitle: t('noMatchesTitle'),
      emptyNoMatchesDescription: t('noMatchesDescription'),
      errorTitle: t('loadErrorTitle'),
      errorDescription: t('loadErrorBody'),
      errorStaleBanner: t('staleBanner'),
      retry: t('retry'),
      loadingLabel: t('loadingLabel'),
    }),
    [t],
  );

  return (
    <DirectoryTable
      state={state}
      query={queryStatus}
      rows={client.rows}
      meta={client.meta}
      filters={[]}
      sorts={sorts}
      columns={columns}
      sticky
      getRowKey={(session) => session.sitting_document_id}
      rowAttrs={(session) => ({
        'data-slot': 'past-session-row',
        'data-status': session.status,
      })}
      regionAttrs={{ role: 'group', 'aria-label': t('scrollRegionLabel') }}
      labels={labels}
    />
  );
}

export { PastSessionsTable };
