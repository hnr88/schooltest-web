'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { PortalToggleRow } from '@/modules/notifications/components/PortalToggleRow';
import { NOTIFICATION_SECTION_LABEL_CLASS } from '@/modules/notifications/constants/notification-preferences.constants';
import type {
  NotificationPreferenceEventConfig,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

// Row 05 (D-01) — the design's per-EVENT switches. Structurally the sibling of
// NotificationPreferenceToggleGroup and deliberately not merged with it: that
// one binds a flat boolean field, this one binds into the `eventPreferences`
// map, and forcing one component to do both would mean a union field type on
// every caller for no gain.
function NotificationPreferenceEventGroup({
  title,
  items,
  form,
  divided = false,
}: {
  title: string;
  items: readonly NotificationPreferenceEventConfig[];
  form: UseFormReturn<NotificationPreferenceFormValues>;
  divided?: boolean;
}) {
  const t = useTranslations('Settings');

  return (
    <fieldset className={cn('flex flex-col', divided && 'mt-5 border-t border-divider pt-5')}>
      <legend className={NOTIFICATION_SECTION_LABEL_CLASS}>{title}</legend>
      <div className="flex flex-col">
        {items.map((item) => (
          <Controller
            key={item.event}
            control={form.control}
            name={`eventPreferences.${item.event}` as const}
            render={({ field }) => (
              <PortalToggleRow
                title={t(item.titleKey)}
                description={t(item.descriptionKey)}
                helper={item.helperKey === undefined ? undefined : t(item.helperKey)}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        ))}
      </div>
    </fieldset>
  );
}

export { NotificationPreferenceEventGroup };
