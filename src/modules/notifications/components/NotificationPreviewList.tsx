'use client';

import { NotificationPreviewItem } from '@/modules/notifications/components/NotificationPreviewItem';
import type { Notification } from '@/modules/notifications/types/notification.types';

function NotificationPreviewList({
  notifications,
  onActivate,
}: {
  notifications: Notification[];
  onActivate: (notification: Notification) => void;
}) {
  return (
    <ul data-slot="notification-preview-list" className="flex flex-col gap-0.5">
      {notifications.map((notification) => (
        <NotificationPreviewItem
          key={notification.documentId}
          notification={notification}
          onActivate={onActivate}
        />
      ))}
    </ul>
  );
}

export { NotificationPreviewList };
