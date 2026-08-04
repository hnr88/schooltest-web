'use client';

import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button, EmptyState } from '@/modules/design-system';
import { NotificationFeedList } from '@/modules/notifications/components/NotificationFeedList';
import { NotificationFeedSkeleton } from '@/modules/notifications/components/NotificationFeedSkeleton';

import type { NotificationFeedBodyProps } from '@/modules/notifications/types/components.types';

export function NotificationFeedBody({
  isPending,
  isError,
  onRetry,
  notifications,
  onMarkRead,
  isMarking,
}: NotificationFeedBodyProps) {
  const t = useTranslations('Notifications');
  if (isPending) return <NotificationFeedSkeleton />;
  if (isError) {
    return (
      <Alert
        variant="error"
        className="my-4"
        title={t('errorTitle')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="min-h-11 rounded-full"
          >
            {t('retry')}
          </Button>
        }
      >
        {t('errorDescription')}
      </Alert>
    );
  }
  if (notifications.length === 0) {
    return (
      <EmptyState
        tone="brand"
        icon={Inbox}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        className="my-4 border-divider [&>p+p]:text-body"
      />
    );
  }
  return (
    <NotificationFeedList
      notifications={notifications}
      onMarkRead={onMarkRead}
      isMarking={isMarking}
    />
  );
}
