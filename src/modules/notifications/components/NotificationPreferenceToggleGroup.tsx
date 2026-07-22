'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { NotificationPreferenceToggle } from '@/modules/notifications/components/NotificationPreferenceToggle';
import { NOTIFICATION_SECTION_LABEL_CLASS } from '@/modules/notifications/constants/notification-preferences.constants';
import type {
  NotificationPreferenceFormValues,
  NotificationPreferenceToggleConfig,
} from '@/modules/notifications/types/notification-preference.types';

function NotificationPreferenceToggleGroup({
  id,
  title,
  items,
  form,
}: {
  id: string;
  title: string;
  items: readonly NotificationPreferenceToggleConfig[];
  form: UseFormReturn<NotificationPreferenceFormValues>;
}) {
  const t = useTranslations('Settings');

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={NOTIFICATION_SECTION_LABEL_CLASS}>{title}</legend>
      <div className="flex flex-col">
        {items.map((item) => (
          <Controller
            key={item.field}
            control={form.control}
            name={item.field}
            render={({ field }) => (
              <NotificationPreferenceToggle
                id={`${id}-${item.field}`}
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
