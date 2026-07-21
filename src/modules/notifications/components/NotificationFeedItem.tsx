'use client';

import { Check, ExternalLink } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button, Badge } from '@/modules/design-system';
import { NotificationCategoryIcon } from '@/modules/notifications/components/NotificationCategoryIcon';
import { getNotificationTileClass } from '@/modules/notifications/lib/notification-display';
import type { Notification } from '@/modules/notifications/types/notification.types';

function NotificationFeedItem({
  notification,
  onMarkRead,
  isMarking,
}: {
  notification: Notification;
  onMarkRead?: (documentId: string) => void;
  isMarking?: boolean;
}) {
  const format = useFormatter();
  const t = useTranslations('Notifications');
  const isUnread = notification.readAt === null;
  const title = notification.title;

  return (
    <li>
      <article
        data-slot="notification-item"
        data-notification-id={notification.documentId}
        data-read={String(!isUnread)}
        className={cn(
          'flex gap-3 rounded-xl border p-4',
          isUnread ? 'border-blue-100 bg-blue-50 dark:border-blue-950' : 'border-border bg-card',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            getNotificationTileClass(notification.category),
          )}
        >
          <NotificationCategoryIcon category={notification.category} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              {notification.linkUrl ? (
                <Button
                  href={notification.linkUrl}
                  variant="ghost"
                  className="h-auto min-h-11 justify-start p-0 text-left font-semibold text-foreground hover:bg-transparent"
                >
                  {title}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </Button>
              ) : (
                <h3 className="font-semibold text-foreground">{title}</h3>
              )}
              {notification.body ? (
                <p className="text-sm text-muted-foreground">{notification.body}</p>
              ) : null}
            </div>
            {isUnread ? <Badge variant="accent">{t('unread')}</Badge> : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
              <span>{t(`categories.${notification.category}`)}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={notification.createdAt}>
                {format.dateTime(new Date(notification.createdAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </time>
            </div>
            {isUnread && onMarkRead ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={isMarking}
                onClick={() => onMarkRead(notification.documentId)}
                className="min-h-11 text-primary hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <Check aria-hidden="true" className="size-4" />
                {t('markRead')}
              </Button>
            ) : (
              <span className="inline-flex min-h-11 items-center gap-2 text-caption text-muted-foreground">
                <Check aria-hidden="true" className="size-4 text-teal-600" />
                {t('read')}
              </span>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

export { NotificationFeedItem };
