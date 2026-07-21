'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { NOTIFICATION_DIGEST_FREQUENCIES } from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationPreferenceToggleGroup } from '@/modules/notifications/components/NotificationPreferenceToggleGroup';
import type {
  NotificationDigestFrequency,
  NotificationPreferenceFormValues,
  NotificationPreferenceToggleConfig,
} from '@/modules/notifications/types/notification-preference.types';

const DELIVERY_TOGGLES: readonly NotificationPreferenceToggleConfig[] = [
  {
    field: 'emailEnabled',
    titleKey: 'notificationPreferences.channels.email.title',
    descriptionKey: 'notificationPreferences.channels.email.description',
  },
  {
    field: 'inAppEnabled',
    titleKey: 'notificationPreferences.channels.inApp.title',
    descriptionKey: 'notificationPreferences.channels.inApp.description',
  },
];

const CATEGORY_TOGGLES: readonly NotificationPreferenceToggleConfig[] = [
  {
    field: 'children',
    titleKey: 'notificationPreferences.categories.children.title',
    descriptionKey: 'notificationPreferences.categories.children.description',
  },
  {
    field: 'testActivity',
    titleKey: 'notificationPreferences.categories.testActivity.title',
    descriptionKey: 'notificationPreferences.categories.testActivity.description',
  },
  {
    field: 'testResults',
    titleKey: 'notificationPreferences.categories.testResults.title',
    descriptionKey: 'notificationPreferences.categories.testResults.description',
  },
];

function NotificationPreferenceFields({
  form,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
}) {
  const t = useTranslations('Settings');
  const digestOptions = NOTIFICATION_DIGEST_FREQUENCIES.map((value) => ({
    value,
    label: t(`notificationPreferences.digest.options.${value}`),
  }));

  return (
    <div className="flex flex-col gap-6">
      <NotificationPreferenceToggleGroup
        id="notification-delivery"
        title={t('notificationPreferences.deliveryTitle')}
        items={DELIVERY_TOGGLES}
        form={form}
      />
      <NotificationPreferenceToggleGroup
        id="notification-category"
        title={t('notificationPreferences.categoriesTitle')}
        items={CATEGORY_TOGGLES}
        form={form}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Controller
          control={form.control}
          name="digestFrequency"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor="notification-digest-frequency">
                {t('notificationPreferences.digest.title')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('notificationPreferences.digest.description')}
              </p>
              <Select<NotificationDigestFrequency, false>
                items={digestOptions}
                value={field.value}
                onValueChange={(value) => value !== null && field.onChange(value)}
              >
                <SelectTrigger id="notification-digest-frequency" className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {digestOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <Alert variant="info" title={t('notificationPreferences.alwaysOnTitle')}>
          {t('notificationPreferences.alwaysOnDescription')}
        </Alert>
      </div>
    </div>
  );
}

export { NotificationPreferenceFields };
