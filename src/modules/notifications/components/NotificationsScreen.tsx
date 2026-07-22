'use client';

import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Alert, Button, DataPanel, EmptyState } from '@/modules/design-system';
import { NotificationCategoryFilter } from '@/modules/notifications/components/NotificationCategoryFilter';
import { NotificationFeedList } from '@/modules/notifications/components/NotificationFeedList';
import { NotificationFeedPagination } from '@/modules/notifications/components/NotificationFeedPagination';
import { NotificationFeedSkeleton } from '@/modules/notifications/components/NotificationFeedSkeleton';
import {
  NOTIFICATION_FEED_PAGE_SIZE,
  PORTAL_CARD_CLASS,
  PORTAL_SCREEN_CLASS,
} from '@/modules/notifications/constants/notification.constants';
import { useNotificationActions } from '@/modules/notifications/hooks/use-notification-actions';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';
import type { NotificationCategoryFilterValue } from '@/modules/notifications/types/notification.types';

// Header action (.qa/design/spec/03 §5.1): a transparent 13.5/600 #2563EB button, not
// a bordered control. The 44px target comes from min-h-11, the drawn box is the text.
const MARK_ALL_CLASS =
  'inline-flex min-h-11 items-center rounded-lg px-1 text-body-sm font-semibold text-primary transition duration-200 ease-out-expo hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100';

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
          <p className="mt-1.5 text-body-md text-body">{t('unreadCount', { count: unreadCount })}</p>
        </div>
        <button
          type="button"
          disabled={unreadCount === 0 || actions.isMarkingAll}
          onClick={actions.markAllRead}
          className={MARK_ALL_CLASS}
        >
          {t('markAllRead')}
        </button>
      </header>
      <NotificationCategoryFilter value={category} onValueChange={handleCategoryChange} />
      <DataPanel
        aria-label={t('recentTitle')}
        className={cn(PORTAL_CARD_CLASS, 'flex flex-col px-4 py-1.5 sm:px-7')}
      >
        {notificationsQuery.isPending ? (
          <NotificationFeedSkeleton />
        ) : notificationsQuery.isError ? (
          <Alert
            variant="error"
            className="my-4"
            title={t('errorTitle')}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => notificationsQuery.refetch()}
                className="min-h-11 rounded-full"
              >
                {t('retry')}
              </Button>
            }
          >
            {t('errorDescription')}
          </Alert>
        ) : notifications.length === 0 ? (
          <EmptyState
            tone="brand"
            icon={Inbox}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            className="my-4 border-divider [&>p+p]:text-body"
          />
        ) : (
          <NotificationFeedList
            notifications={notifications}
            onMarkRead={actions.markRead}
            isMarking={actions.isMarkingRead}
          />
        )}
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
