'use client';

import { useTranslations } from 'next-intl';

import { MARK_ALL_CLASS } from '@/modules/notifications/constants/components.constants';

import type { NotificationFeedHeaderProps } from '@/modules/notifications/types/components.types';

export function NotificationFeedHeader({
  unreadCount,
  isMarkingAll,
  onMarkAllRead,
}: NotificationFeedHeaderProps) {
  const t = useTranslations('Notifications');
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1.5 text-body-md text-body">{t('unreadCount', { count: unreadCount })}</p>
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
