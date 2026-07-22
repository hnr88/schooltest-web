'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow, Separator } from '@/modules/design-system';

function NotificationDayHeading({ date, dayOffset }: { date: Date; dayOffset: number }) {
  const format = useFormatter();
  const t = useTranslations('Notifications');
  const label =
    dayOffset === 0
      ? t('today')
      : dayOffset === 1
        ? t('yesterday')
        : format.dateTime(date, { dateStyle: 'medium' });

  return (
    <div className="flex items-center gap-3">
      <Eyebrow className="shrink-0 text-muted-foreground">{label}</Eyebrow>
      <Separator className="flex-1" />
    </div>
  );
}

export { NotificationDayHeading };
