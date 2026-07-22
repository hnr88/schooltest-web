'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { PortalToggleRow } from '@/modules/notifications/components/PortalToggleRow';
import { NOTIFICATION_SECTION_LABEL_CLASS } from '@/modules/notifications/constants/notification-preferences.constants';
import type {
  NotificationPreferenceFormValues,
  NotificationPreferenceToggleConfig,
} from '@/modules/notifications/types/notification-preference.types';

// Grouped rows INSIDE one portal card: a #EEF1F6 rule above the group with 20px of
// air, never a second card. `divided` opts the second and later groups into it.
function NotificationPreferenceToggleGroup({
  title,
  items,
  form,
  divided = false,
}: {
  title: string;
  items: readonly NotificationPreferenceToggleConfig[];
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
            key={item.field}
            control={form.control}
            name={item.field}
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

export { NotificationPreferenceToggleGroup };
