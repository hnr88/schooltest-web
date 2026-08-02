'use client';

import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Alert, Button, DataPanel, EmptyState } from '@/modules/design-system';
import { NotificationFeedPagination } from '@/modules/notifications/components/NotificationFeedPagination';
import { NotificationFeedSkeleton } from '@/modules/notifications/components/NotificationFeedSkeleton';
import { TeacherNotificationFeedItem } from '@/modules/notifications/components/TeacherNotificationFeedItem';
import {
  NOTIFICATION_FEED_PAGE_SIZE,
  PORTAL_CARD_CLASS,
  PORTAL_SCREEN_CLASS,
} from '@/modules/notifications/constants/notification.constants';
import { useMarkNotificationReadMutation } from '@/modules/notifications/queries/use-mark-notification-read.mutation';
import { useSchoolNotificationsQuery } from '@/modules/notifications/queries/use-school-notifications.query';

// Teacher notification feed (task 113, st-mvp-pivot; mvp-updates 4.4/4.3):
// the full C-NOT-01 feed behind the bell's view-all - results-ready, window
// and email-fix rows for the signed-in teacher or school_admin. Reuses the
// portal feed's skeleton, pagination, card chrome and mark-read mutation
// (PUT /api/notifications/:documentId/read is granted to school roles); the
// mutation's ['notifications'] invalidation refetches this feed. No category
// filter: the C-NOT-01 row carries no category.
function TeacherNotificationsScreen() {
  const t = useTranslations('Notifications');
  const now = useNow();
  const [page, setPage] = useState(1);
  const notificationsQuery = useSchoolNotificationsQuery({
    page,
    pageSize: NOTIFICATION_FEED_PAGE_SIZE,
  });
  const markReadMutation = useMarkNotificationReadMutation();
  const pagination = notificationsQuery.data?.meta.pagination;
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  function handleMarkRead(documentId: string) {
    markReadMutation.mutate(documentId, {
      onError: () => toast.error(t('actionError')),
    });
  }

  return (
    <main
      data-surface="teacher-notifications"
      className={cn(
        PORTAL_SCREEN_CLASS,
        'animate-in duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none',
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1.5 text-body-md text-body">{t('unreadCount', { count: unreadCount })}</p>
      </header>
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
            title={t('teacherFeed.emptyTitle')}
            description={t('teacherFeed.emptyDescription')}
            className="my-4 border-divider [&>p+p]:text-body"
          />
        ) : (
          <ul className="flex flex-col">
            {notifications.map((notification) => (
              <TeacherNotificationFeedItem
                key={notification.documentId}
                notification={notification}
                now={now}
                onMarkRead={handleMarkRead}
                isMarking={markReadMutation.isPending}
              />
            ))}
          </ul>
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

export { TeacherNotificationsScreen };
