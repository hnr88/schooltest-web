'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { PortalPanel } from '@/modules/notifications/components/PortalPanel';
import {
  NOTIFICATION_DIGEST_FREQUENCIES,
  NOTIFICATION_SELECT_TRIGGER_CLASS,
} from '@/modules/notifications/constants/notification-preferences.constants';
import type {
  NotificationDigestFrequency,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

// The panel heading is ALSO the field label — the trigger takes aria-labelledby from
// it — so the 16/600 card title does the naming and no second label repeats it.
function NotificationDigestField({
  form,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
}) {
  const t = useTranslations('Settings');
  // P-07: the "coming soon" gate is gone. NOTIFICATION_DIGEST_SELECTABLE_FREQUENCIES
  // had become identical to NOTIFICATION_DIGEST_FREQUENCIES, so
  // `isSelectableDigestFrequency` always returned true and the deferred/disabled
  // branch could never fire — dead code plus an unreachable i18n key. Every
  // frequency is genuinely honoured by the digest worker.
  const options = NOTIFICATION_DIGEST_FREQUENCIES.map((value) => ({
    value,
    label: t(`notificationPreferences.digest.options.${value}`),
  }));

  return (
    <Controller
      control={form.control}
      name="digestFrequency"
      render={({ field }) => (
        <PortalPanel
          id="notification-digest"
          title={t('notificationPreferences.digest.title')}
          description={t('notificationPreferences.digest.description')}
        >
          <Select<NotificationDigestFrequency, false>
            items={options}
            value={field.value}
            onValueChange={(value) => value !== null && field.onChange(value)}
          >
            <SelectTrigger
              id="notification-digest-frequency"
              aria-labelledby="notification-digest-title"
              className={NOTIFICATION_SELECT_TRIGGER_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p role="status" className="mt-2.5 text-meta font-medium text-warning-ink">
            {field.value === 'immediate'
              ? ''
              : field.value === 'off'
                ? t('notificationPreferences.digest.emailOffNotice')
                : t(`notificationPreferences.digest.scheduleNote.${field.value}`)}
          </p>
        </PortalPanel>
      )}
    />
  );
}

export { NotificationDigestField };
