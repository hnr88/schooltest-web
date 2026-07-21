'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { NOTIFICATION_PREFERENCE_DEFAULTS } from '@/modules/notifications/constants/notification-preferences.constants';
import { toNotificationPreferenceFormValues } from '@/modules/notifications/lib/notification-preferences';
import { useNotificationPreferencesQuery } from '@/modules/notifications/queries/use-notification-preferences.query';
import { useUpdateNotificationPreferencesMutation } from '@/modules/notifications/queries/use-update-notification-preferences.mutation';
import { notificationPreferenceFormSchema } from '@/modules/notifications/schemas/notification-preference.schema';
import type { NotificationPreferenceFormValues } from '@/modules/notifications/types/notification-preference.types';

function useNotificationPreferenceForm() {
  const t = useTranslations('Settings');
  const query = useNotificationPreferencesQuery();
  const update = useUpdateNotificationPreferencesMutation();
  const form = useForm<NotificationPreferenceFormValues>({
    resolver: zodResolver(notificationPreferenceFormSchema),
    defaultValues: NOTIFICATION_PREFERENCE_DEFAULTS,
  });

  useEffect(() => {
    if (query.data) form.reset(toNotificationPreferenceFormValues(query.data));
  }, [form, query.data]);

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: (preferences) => {
        form.reset(toNotificationPreferenceFormValues(preferences));
        toast.success(t('notificationPreferences.saved'));
      },
      onError: () => toast.error(t('notificationPreferences.saveError')),
    });
  });

  return {
    form,
    onSubmit,
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: update.isPending,
    refetch: query.refetch,
  };
}

export { useNotificationPreferenceForm };
