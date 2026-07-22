'use client';

import { ArrowUpRight, Check } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
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

  return (
    <li>
      <article
        data-slot="notification-item"
        data-notification-id={notification.documentId}
        data-read={String(!isUnread)}
        className={cn(
          'flex gap-3 rounded-xl border border-border p-4 transition-colors duration-200 ease-out-expo motion-reduce:transition-none',
          isUnread ? 'bg-card shadow-sm' : 'bg-muted/40',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            getNotificationTileClass(notification.category),
          )}
        >
          <NotificationCategoryIcon category={notification.category} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 shrink-0 rounded-full bg-primary transition duration-200 ease-out-expo motion-reduce:transition-none',
                  isUnread ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                )}
              />
              {isUnread ? <span className="sr-only">{t('unread')}</span> : null}
              {notification.linkUrl ? (
                <Link
                  href={notification.linkUrl}
                  className="inline-flex items-center gap-1 rounded-sm underline-offset-4 transition-colors duration-200 ease-out-expo hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
                >
                  {notification.title}
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              ) : (
                notification.title
              )}
            </h3>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {isUnread && onMarkRead ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={isMarking}
                  onClick={() => onMarkRead(notification.documentId)}
                  className="min-h-9 font-semibold text-primary hover:bg-blue-100 dark:hover:bg-blue-950"
                >
                  <Check aria-hidden="true" className="size-4" />
                  {t('markRead')}
                </Button>
              ) : (
                <p className="inline-flex min-h-9 items-center gap-1.5 text-caption font-medium text-muted-foreground">
                  <Check aria-hidden="true" className="size-4 text-teal-600 dark:text-teal-500" />
                  {t('read')}
                </p>
              )}
            </div>
          </div>
          {notification.body ? (
            <p className="text-sm text-muted-foreground">{notification.body}</p>
          ) : null}
          <p className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <span className="font-medium">{t(`categories.${notification.category}`)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={notification.createdAt}>
              {format.dateTime(new Date(notification.createdAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </time>
          </p>
        </div>
      </article>
    </li>
  );
}

export { NotificationFeedItem };
