'use client';

import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/modules/design-system';
import { NotificationFeedList } from '@/modules/notifications/components/NotificationFeedList';
import { NotificationFeedPagination } from '@/modules/notifications/components/NotificationFeedPagination';
import { NOTIFICATION_FEED_PAGE_SIZE } from '@/modules/notifications/constants/notification.constants';
import { useNotificationActions } from '@/modules/notifications/hooks/use-notification-actions';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';

function NotificationsScreen() {
  const t = useTranslations('Notifications');
  const [page, setPage] = useState(1);
  const notificationsQuery = useNotificationsQuery({ page, pageSize: NOTIFICATION_FEED_PAGE_SIZE });
  const actions = useNotificationActions();
  const pagination = notificationsQuery.data?.meta.pagination;
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  return (
    <main data-surface="notification-feed" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h3 font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-50 px-4 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Bell aria-hidden="true" className="size-4" />
          {t('unreadCount', { count: unreadCount })}
        </span>
      </header>
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>{t('recentTitle')}</CardTitle>
          <CardDescription>{t('feedDescription')}</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              loading={actions.isMarkingAll}
              disabled={unreadCount === 0}
              onClick={actions.markAllRead}
              className="min-h-11"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              {t('markAllRead')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {notificationsQuery.isPending ? (
            <div aria-hidden="true" className="flex flex-col gap-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : notificationsQuery.isError ? (
            <Alert
              variant="error"
              title={t('errorTitle')}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => notificationsQuery.refetch()}
                  className="min-h-11"
                >
                  {t('retry')}
                </Button>
              }
            >
              {t('errorDescription')}
            </Alert>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Inbox} title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : (
            <>
              <NotificationFeedList
                notifications={notifications}
                onMarkRead={actions.markRead}
                isMarking={actions.isMarkingRead}
              />
              {pagination && pagination.pageCount > 1 ? (
                <NotificationFeedPagination
                  page={pagination.page}
                  pageCount={pagination.pageCount}
                  onPrevious={() => setPage((current) => current - 1)}
                  onNext={() => setPage((current) => current + 1)}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export { NotificationsScreen };
