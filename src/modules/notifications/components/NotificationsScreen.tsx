'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { DataPanel } from '@/modules/design-system';
import { NotificationCategoryFilter } from '@/modules/notifications/components/NotificationCategoryFilter';
import { NotificationFeedBody } from '@/modules/notifications/components/NotificationFeedBody';
import { NotificationFeedHeader } from '@/modules/notifications/components/NotificationFeedHeader';
import { NotificationFeedPagination } from '@/modules/notifications/components/NotificationFeedPagination';
import {
  NOTIFICATION_FEED_PAGE_SIZE,
  PORTAL_CARD_CLASS,
  PORTAL_SCREEN_CLASS,
} from '@/modules/notifications/constants/notification.constants';
import { useNotificationActions } from '@/modules/notifications/hooks/use-notification-actions';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';

import type { NotificationCategoryFilterValue } from '@/modules/notifications/types/notification.types';

function NotificationsScreen() {
  const t = useTranslations('Notifications');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<NotificationCategoryFilterValue>('all');
  const notificationsQuery = useNotificationsQuery({
    page,
    pageSize: NOTIFICATION_FEED_PAGE_SIZE,
    ...(category === 'all' ? {} : { category }),
  });
  const actions = useNotificationActions();
  const pagination = notificationsQuery.data?.meta.pagination;
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  function handleCategoryChange(next: NotificationCategoryFilterValue) {
    setCategory(next);
    setPage(1);
  }

  return (
    <main
      data-surface="notification-feed"
      className={cn(
        PORTAL_SCREEN_CLASS,
        // No `fade-in-0`: an opacity ramp composites the 12.5px timestamp ink below
        // AA for the length of the transition, which axe fails as SERIOUS. The
        // entrance is the slide alone.
        'animate-in duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none',
      )}
    >
      <NotificationFeedHeader
        unreadCount={unreadCount}
        isMarkingAll={actions.isMarkingAll}
        onMarkAllRead={actions.markAllRead}
      />
      <NotificationCategoryFilter value={category} onValueChange={handleCategoryChange} />
      <DataPanel
        aria-label={t('recentTitle')}
        className={cn(PORTAL_CARD_CLASS, 'flex flex-col px-4 py-1.5 sm:px-7')}
      >
        <NotificationFeedBody
          isPending={notificationsQuery.isPending}
          isError={notificationsQuery.isError}
          onRetry={() => notificationsQuery.refetch()}
          notifications={notifications}
          onMarkRead={actions.markRead}
          isMarking={actions.isMarkingRead}
        />
        <div className="pb-3.5" />
      </DataPanel>
      {pagination && pagination.pageCount > 1 ? (
        <NotificationFeedPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onPrevious={() => setPage((current) => current - 1)}
          onNext={() => setPage((current) => current + 1)}
        />
      ) : null}
    </main>
  );
}

export { NotificationsScreen };
