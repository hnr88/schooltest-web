'use client';

import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button, EmptyState, Skeleton } from '@/modules/design-system';
import { NotificationPreviewList } from '@/modules/notifications/components/NotificationPreviewList';
import type { Notification } from '@/modules/notifications/types/notification.types';

function NotificationPreviewPanel({
  notifications,
  isPending,
  isError,
  onRetry,
  onActivate,
}: {
  notifications: Notification[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onActivate: (notification: Notification) => void;
}) {
  const t = useTranslations('Notifications');

  if (isPending) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-0.5 p-1.5">
        <Skeleton className="h-15 w-full rounded-lg" />
        <Skeleton className="h-15 w-full rounded-lg" />
        <Skeleton className="h-15 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3">
        <Alert
          variant="error"
          title={t('errorTitle')}
          className="border-border"
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-3">
        <EmptyState
          icon={Inbox}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="border-0 bg-muted/50 p-6"
        />
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto overscroll-contain p-1.5">
      <NotificationPreviewList notifications={notifications} onActivate={onActivate} />
    </div>
  );
}

export { NotificationPreviewPanel };
