'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  NOTIFICATION_CATEGORY_FILTERS,
  PORTAL_PILL_CLASS,
  PORTAL_PILL_IDLE_CLASS,
  PORTAL_PILL_SELECTED_CLASS,
} from '@/modules/notifications/constants/notification.constants';
import type { NotificationCategoryFilterValue } from '@/modules/notifications/types/notification.types';

// PortalChip, Pill variant — the same control the Settings → Language row draws.
function NotificationCategoryFilter({
  value,
  onValueChange,
}: {
  value: NotificationCategoryFilterValue;
  onValueChange: (next: NotificationCategoryFilterValue) => void;
}) {
  const t = useTranslations('Notifications');

  return (
    <div
      role="group"
      data-slot="notification-category-filter"
      aria-label={t('filterLabel')}
      className="flex flex-wrap gap-2"
    >
      {NOTIFICATION_CATEGORY_FILTERS.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onValueChange(option)}
            className={cn(
              PORTAL_PILL_CLASS,
              selected ? PORTAL_PILL_SELECTED_CLASS : PORTAL_PILL_IDLE_CLASS,
            )}
          >
            {option === 'all' ? t('filters.all') : t(`categories.${option}`)}
          </button>
        );
      })}
    </div>
  );
}

export { NotificationCategoryFilter };
