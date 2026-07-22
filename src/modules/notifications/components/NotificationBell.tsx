'use client';

import { ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  CountBadge,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/modules/design-system';
import { NotificationPreviewPanel } from '@/modules/notifications/components/NotificationPreviewPanel';
import { NOTIFICATION_PREVIEW_PAGE_SIZE } from '@/modules/notifications/constants/notification.constants';
import { useNotificationActions } from '@/modules/notifications/hooks/use-notification-actions';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';
import type { Notification } from '@/modules/notifications/types/notification.types';

function NotificationBell() {
  const t = useTranslations('Notifications');
  const [isOpen, setIsOpen] = useState(false);
  const notificationsQuery = useNotificationsQuery({
    page: 1,
    pageSize: NOTIFICATION_PREVIEW_PAGE_SIZE,
  });
  const actions = useNotificationActions();
  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;

  function handleActivate(notification: Notification) {
    if (notification.readAt === null) actions.markRead(notification.documentId);
    if (notification.linkUrl) setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        data-slot="notification-bell"
        aria-label={t('bellLabel')}
        className="relative inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 ease-out-expo hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
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
      <PopoverContent
        data-slot="notification-popover"
        align="end"
        sideOffset={8}
        className="w-80 gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-lg ring-0 duration-200 ease-out-expo motion-reduce:animate-none sm:w-96"
      >
        <PopoverHeader className="flex-row items-center gap-2 border-b border-border py-1.5 pr-1.5 pl-3">
          <PopoverTitle className="text-sm font-semibold text-foreground">{t('title')}</PopoverTitle>
          {unreadCount > 0 ? (
            <CountBadge count={unreadCount} ariaLabel={t('unreadCount', { count: unreadCount })} />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={actions.isMarkingAll}
            disabled={unreadCount === 0}
            onClick={actions.markAllRead}
            className="ml-auto min-h-11 font-medium text-primary hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            {t('markAllReadShort')}
          </Button>
        </PopoverHeader>
        <NotificationPreviewPanel
          notifications={notifications}
          isPending={notificationsQuery.isPending}
          isError={notificationsQuery.isError}
          onRetry={() => void notificationsQuery.refetch()}
          onActivate={handleActivate}
        />
        <div className="border-t border-border p-1.5">
          <Button
            href="/dashboard/notifications"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-auto min-h-11 w-full justify-center gap-1.5 text-caption font-semibold text-primary hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            {t('viewAll')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationBell };
