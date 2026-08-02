'use client';

import { Bell } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  getNotificationFeedTileClass,
  getNotificationTimeTier,
} from '@/modules/notifications/lib/notification-display';
import type { SchoolNotification } from '@/modules/notifications/types/school-notification.types';

// Teacher feed row (task 113): same geometry as the portal NotificationFeedItem
// (40px tile, title over body over timestamp, 8px trailing dot) but driven by
// the C-NOT-01 shape - a neutral bell glyph (the school feed exposes no
// category), `read` instead of readAt, `link` instead of linkUrl. Opening a
// linked row marks it read, so the dot and the title link share one handler.
function TeacherNotificationFeedItem({
  notification,
  now,
  onMarkRead,
  isMarking,
}: {
  notification: SchoolNotification;
  now: Date;
  onMarkRead?: (documentId: string) => void;
  isMarking?: boolean;
}) {
  const format = useFormatter();
  const t = useTranslations('Notifications');
  const isUnread = !notification.read;
  const createdAt = new Date(notification.createdAt);
  const tier = getNotificationTimeTier(createdAt, now);
  const timeLabel =
    tier === 'relative'
      ? format.relativeTime(createdAt, now)
      : tier === 'weekday'
        ? format.dateTime(createdAt, { weekday: 'long' })
        : format.dateTime(createdAt, { day: 'numeric', month: 'long' });

  return (
    <li
      data-slot="school-notification-item"
      data-notification-id={notification.documentId}
      data-read={String(notification.read)}
      className="flex animate-in items-start gap-4 border-b border-divider py-4.25 duration-300 ease-out-expo slide-in-from-bottom-1 last:border-b-0 motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-tile transition-colors duration-200 ease-out-expo motion-reduce:transition-none',
          getNotificationFeedTileClass(isUnread),
        )}
      >
        <Bell aria-hidden="true" className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-lede font-semibold text-foreground">
          {notification.link ? (
            <Link
              href={notification.link}
              onClick={() => onMarkRead?.(notification.documentId)}
              className="relative rounded-sm underline-offset-4 transition-colors duration-200 ease-out-expo after:absolute after:inset-x-0 after:-inset-y-2 hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
            >
              {notification.title}
            </Link>
          ) : (
            notification.title
          )}
        </h3>
        {isUnread ? <span className="sr-only">{t('unread')}</span> : null}
        {notification.body ? (
          <p className="mt-0.5 text-caption leading-normal text-body">{notification.body}</p>
        ) : null}
        <p className="mt-1.25 text-meta text-muted-foreground">
          <time dateTime={notification.createdAt}>{timeLabel}</time>
        </p>
      </div>
      {isUnread && onMarkRead ? (
        <button
          type="button"
          title={t('markRead')}
          aria-label={t('markRead')}
          disabled={isMarking}
          onClick={() => onMarkRead(notification.documentId)}
          className="relative mt-1.5 size-2 shrink-0 rounded-full bg-primary transition-transform duration-200 ease-out-expo after:absolute after:-inset-4.5 hover:scale-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card focus-visible:outline-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:scale-100"
        />
      ) : (
        <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full" />
      )}
    </li>
  );
}

export { TeacherNotificationFeedItem };
