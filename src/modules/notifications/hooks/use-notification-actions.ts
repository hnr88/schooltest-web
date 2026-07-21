'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useMarkAllNotificationsReadMutation } from '@/modules/notifications/queries/use-mark-all-notifications-read.mutation';
import { useMarkNotificationReadMutation } from '@/modules/notifications/queries/use-mark-notification-read.mutation';

function useNotificationActions() {
  const t = useTranslations('Notifications');
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const markRead = (documentId: string) => {
    markReadMutation.mutate(documentId, {
      onError: () => toast.error(t('actionError')),
    });
  };

  const markAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onError: () => toast.error(t('actionError')),
    });
  };

  return {
    markRead,
    markAllRead,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAll: markAllReadMutation.isPending,
  };
}

export { useNotificationActions };
