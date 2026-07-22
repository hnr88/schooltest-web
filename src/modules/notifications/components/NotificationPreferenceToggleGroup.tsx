'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { NotificationPreferenceToggle } from '@/modules/notifications/components/NotificationPreferenceToggle';
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
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-foreground">{title}</legend>
      <div className="grid gap-3 lg:grid-cols-2">
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
