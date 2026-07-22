'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { NOTIFICATION_DIGEST_FREQUENCIES } from '@/modules/notifications/constants/notification-preferences.constants';
import { isSelectableDigestFrequency } from '@/modules/notifications/lib/notification-preferences';
import type {
  NotificationDigestFrequency,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

function NotificationDigestField({
  form,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
}) {
  const t = useTranslations('Settings');
  const options = NOTIFICATION_DIGEST_FREQUENCIES.map((value) => {
    const label = t(`notificationPreferences.digest.options.${value}`);
    return {
      value,
      label: isSelectableDigestFrequency(value)
        ? label
        : t('notificationPreferences.digest.deferredOption', { label }),
    };
  });

  return (
    <Controller
      control={form.control}
      name="digestFrequency"
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          <Label htmlFor="notification-digest-frequency">
            {t('notificationPreferences.digest.title')}
          </Label>
          <p id="notification-digest-description" className="text-body-sm text-muted-foreground">
            {t('notificationPreferences.digest.description')}
          </p>
          <Select<NotificationDigestFrequency, false>
            items={options}
            value={field.value}
            onValueChange={(value) => value !== null && field.onChange(value)}
          >
            <SelectTrigger
              id="notification-digest-frequency"
              aria-describedby="notification-digest-description"
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={!isSelectableDigestFrequency(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p role="status" className="text-meta font-medium text-warning-ink">
            {field.value === 'immediate' ? '' : t('notificationPreferences.digest.emailOffNotice')}
          </p>
        </div>
      )}
    />
  );
}

export { NotificationDigestField };
