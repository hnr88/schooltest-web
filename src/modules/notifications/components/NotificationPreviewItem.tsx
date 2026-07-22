'use client';

import { useFormatter, useNow, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
import { NotificationCategoryIcon } from '@/modules/notifications/components/NotificationCategoryIcon';
import { getNotificationTileClass } from '@/modules/notifications/lib/notification-display';
import type { Notification } from '@/modules/notifications/types/notification.types';

function NotificationPreviewItem({
  notification,
  onActivate,
}: {
  notification: Notification;
  onActivate: (notification: Notification) => void;
}) {
  const format = useFormatter();
  const now = useNow();
  const t = useTranslations('Notifications');
  const isUnread = notification.readAt === null;

  return (
    <li>
      <Button
        variant="ghost"
        href={notification.linkUrl ?? undefined}
        data-slot="notification-preview-item"
        data-notification-id={notification.documentId}
        data-read={String(!isUnread)}
        onClick={() => onActivate(notification)}
        className={cn(
          'h-auto min-h-14 w-full justify-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left',
          'transition-colors duration-200 ease-out-expo hover:bg-muted motion-reduce:transition-none',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-2 shrink-0 rounded-full bg-primary transition duration-200 ease-out-expo motion-reduce:transition-none',
            isUnread ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full',
            getNotificationTileClass(notification.category),
          )}
        >
          <NotificationCategoryIcon category={notification.category} className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          {isUnread ? <span className="sr-only">{t('unread')}</span> : null}
          <span className="flex items-baseline gap-2">
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm text-foreground',
                isUnread ? 'font-semibold' : 'font-medium',
              )}
            >
              {notification.title}
            </span>
            <time
              dateTime={notification.createdAt}
              className="shrink-0 text-micro font-medium text-muted-foreground"
            >
              {format.relativeTime(new Date(notification.createdAt), { now, style: 'narrow' })}
            </time>
          </span>
          {notification.body ? (
            <span className="truncate text-caption font-normal text-muted-foreground">
              {notification.body}
            </span>
          ) : null}
        </span>
      </Button>
    </li>
  );
}

export { NotificationPreviewItem };
