'use client';

import { useCallback, useMemo, useState } from 'react';
import { useNow, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { DataPanel } from '@/modules/design-system';
import {
  applyClientDirectoryMode,
  DIRECTORY_ALL,
  DirectoryTable,
  useDirectoryState,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryRowAction,
  type DirectorySortDef,
} from '@/modules/directory';
import { NotificationCategoryFilter } from '@/modules/notifications/components/NotificationCategoryFilter';
import { NotificationFeedHeader } from '@/modules/notifications/components/NotificationFeedHeader';
import { NotificationFeedItem } from '@/modules/notifications/components/NotificationFeedItem';
import { NotificationFeedRowMenu } from '@/modules/notifications/components/NotificationFeedRowMenu';
import { PORTAL_CARD_CLASS } from '@/modules/notifications/constants/notification.constants';
import { useNotificationActions } from '@/modules/notifications/hooks/use-notification-actions';
import { getDayOffset } from '@/modules/notifications/lib/notification-grouping';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';

import type {
  Notification,
  NotificationCategoryFilterValue,
} from '@/modules/notifications/types/notification.types';

// ops/36 — the family feed ON the generic directory kit (OP-3, client mode):
// the list is read once at the endpoint's 100-row cap and the kit owns search,
// the read/unread filter, the date sort, pagination and the states, so the
// bespoke pager and empty state are gone. The unread tile weight and the
// trailing read-state dot survive every filter — the dot is the row's inline
// mark-read affordance, and both it and the ⋯ menu route through the existing
// mutation hook (its own invalidation/rollback), never the bulk runner.
// The category pills keep their own control — the dispatch-coverage contract
// drives them by data-slot — and pre-filter the loaded array ahead of the
// kit's reducer.
function NotificationFeedList() {
  const t = useTranslations('Notifications');
  const now = useNow();
  const router = useRouter();
  const [category, setCategory] = useState<NotificationCategoryFilterValue>('all');
  // One read of the whole feed: the params schema caps pageSize at 100, and
  // client-mode search/filter/sort/pagination need the full set, not one
  // server page of it.
  const notificationsQuery = useNotificationsQuery({ page: 1, pageSize: 100 });
  const actions = useNotificationActions();

  const filters = useMemo<DirectoryFilterDef[]>(
    () => [
      {
        key: 'read',
        label: t('feedReadFilterLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('filters.all') },
          { value: 'unread', label: t('unread') },
          { value: 'read', label: t('read') },
        ],
      },
    ],
    [t],
  );

  const sorts = useMemo<DirectorySortDef[]>(
    () => [
      { value: 'date:desc', label: t('feedSortNewest') },
      { value: 'date:asc', label: t('feedSortOldest') },
    ],
    [t],
  );

  const state = useDirectoryState({ filters, sorts, defaultSort: 'date:desc', mode: 'client' });

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('feedSearchPlaceholder'),
      searchLabel: t('feedSearchLabel'),
      sortLabel: t('feedSortLabel'),
      clearFilters: t('feedClearFilters'),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      rowMenuLabel: t('feedRowMenuLabel'),
      showingCount: ({ showing, total }) => t('feedShowingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('feedPageCount', { page, pageCount, total }),
      emptyNoneTitle: t('emptyTitle'),
      emptyNoneDescription: t('emptyDescription'),
      emptyNoMatchesTitle: t('feedFilteredEmptyTitle'),
      emptyNoMatchesDescription: t('feedFilteredEmptyDescription'),
      errorTitle: t('errorTitle'),
      errorStaleBanner: t('feedStaleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('feedLoading'),
    }),
    [t],
  );

  const rowActions = useCallback(
    (notification: Notification): readonly DirectoryRowAction<Notification>[] => {
      const menuActions: DirectoryRowAction<Notification>[] = [];
      if (notification.readAt === null) {
        menuActions.push({
          label: t('markRead'),
          write: true,
          onSelect: () => actions.markRead(notification.documentId),
        });
      }
      if (notification.linkUrl !== null) {
        const linkUrl = notification.linkUrl;
        menuActions.push({
          label: t('feedOpenTarget'),
          onSelect: () => router.push(linkUrl),
        });
      }
      return menuActions;
    },
    [t, actions, router],
  );

  const loaded = notificationsQuery.data?.data ?? [];
  const visible = category === 'all' ? loaded : loaded.filter((n) => n.category === category);
  const { rows, meta } = applyClientDirectoryMode<Notification>(visible, state.params, {
    searchText: (notification) => [
      notification.title,
      notification.body ?? '',
      t(`categories.${notification.category}`),
    ],
    filterPredicates: {
      read: (notification, value) =>
        value === 'unread' ? notification.readAt === null : notification.readAt !== null,
    },
    comparators: {
      'date:asc': (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
      'date:desc': (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    },
  });

  return (
    <>
      <NotificationFeedHeader
        unreadCount={notificationsQuery.data?.meta.unreadCount ?? 0}
        isMarkingAll={actions.isMarkingAll}
        onMarkAllRead={actions.markAllRead}
      />
      <NotificationCategoryFilter value={category} onValueChange={setCategory} />
      <DataPanel
        aria-label={t('recentTitle')}
        className={cn(PORTAL_CARD_CLASS, 'flex flex-col px-4 py-1.5 sm:px-7')}
      >
        <DirectoryTable
          layout="rows"
          state={state}
          query={notificationsQuery}
          rows={rows}
          meta={meta}
          filters={filters}
          sorts={sorts}
          rowActions={rowActions}
          getRowKey={(notification) => notification.documentId}
          labels={labels}
          groupBy={{
            key: (notification) =>
              getDayOffset(new Date(notification.createdAt), now) === 0 ? 'today' : 'earlier',
            heading: (groupKey) => t(groupKey),
            order: ['today', 'earlier'],
          }}
          renderRow={(notification, api) => (
            <NotificationFeedItem
              notification={notification}
              now={now}
              last={api.last}
              menu={
                <NotificationFeedRowMenu
                  actions={api.actions}
                  row={notification}
                  label={t('feedRowMenuLabel')}
                />
              }
              onMarkRead={actions.markRead}
              isMarking={actions.isMarkingRead}
            />
          )}
        />
      </DataPanel>
    </>
  );
}

export { NotificationFeedList };
