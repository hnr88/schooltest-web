'use client';

import { useTranslations } from 'next-intl';

import { MARK_ALL_CLASS, MARK_ALL_READ_CAP } from '@/modules/notifications/constants/components.constants';

import type { NotificationFeedHeaderProps } from '@/modules/notifications/types/components.types';

export function NotificationFeedHeader({
  unreadCount,
  isMarkingAll,
  onMarkAllRead,
}: NotificationFeedHeaderProps) {
  const t = useTranslations('Notifications');
  // F-04: one click clears at most MARK_ALL_READ_CAP. Saying so beats a button
  // that silently leaves rows unread.
  const cappedRemainder = Math.max(0, unreadCount - MARK_ALL_READ_CAP);
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1.5 text-body-md text-body">{t('unreadCount', { count: unreadCount })}</p>
        {cappedRemainder > 0 ? (
          <p className="mt-1 text-body-sm text-body" data-slot="mark-all-cap-notice">
            {t('markAllCapNotice', { cap: MARK_ALL_READ_CAP, remaining: cappedRemainder })}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={unreadCount === 0 || isMarkingAll}
        onClick={onMarkAllRead}
        className={MARK_ALL_CLASS}
      >
        {t('markAllRead')}
      </button>
    </header>
  );
}
