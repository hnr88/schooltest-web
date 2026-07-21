'use client';

import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  CountBadge,
  EmptyState,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Skeleton,
} from '@/modules/design-system';
import { NotificationFeedList } from '@/modules/notifications/components/NotificationFeedList';
import { NOTIFICATION_PREVIEW_PAGE_SIZE } from '@/modules/notifications/constants/notification.constants';
import { useNotificationActions } from '@/modules/notifications/hooks/use-notification-actions';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';

function NotificationBell() {
  const t = useTranslations('Notifications');
  const notificationsQuery = useNotificationsQuery({
    page: 1,
    pageSize: NOTIFICATION_PREVIEW_PAGE_SIZE,
  });
  const actions = useNotificationActions();
  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        data-slot="notification-bell"
        aria-label={t('bellLabel')}
        className="relative inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount > 0 ? (
          <CountBadge
            count={unreadCount}
            ariaLabel={t('unreadCount', { count: unreadCount })}
            className="absolute -top-1 -right-1"
          />
        ) : null}
      </PopoverTrigger>
      <PopoverContent data-slot="notification-popover" align="end" className="w-80 gap-0 p-0 sm:w-96">
        <PopoverHeader className="gap-2 border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <PopoverTitle className="text-base font-bold text-foreground">{t('recentTitle')}</PopoverTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={actions.isMarkingAll}
              disabled={unreadCount === 0}
              onClick={actions.markAllRead}
              className="min-h-11 text-primary hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              {t('markAllRead')}
            </Button>
          </div>
          <PopoverDescription>{t('unreadCount', { count: unreadCount })}</PopoverDescription>
        </PopoverHeader>
        <div className="max-h-96 overflow-y-auto p-4">
          {notificationsQuery.isPending ? (
            <div aria-hidden="true" className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
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
            <EmptyState
              icon={Inbox}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              className="border-0 bg-muted/50 p-6"
            />
          ) : (
            <NotificationFeedList
              notifications={notifications}
              onMarkRead={actions.markRead}
              isMarking={actions.isMarkingRead}
            />
          )}
        </div>
        <div className="border-t border-border p-3">
          <Button href="/dashboard/notifications" variant="outline" className="min-h-11 w-full">
            {t('viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationBell };
