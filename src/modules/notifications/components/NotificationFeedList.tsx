import { NotificationFeedItem } from '@/modules/notifications/components/NotificationFeedItem';
import type { Notification } from '@/modules/notifications/types/notification.types';

function NotificationFeedList({
  notifications,
  onMarkRead,
  isMarking,
}: {
  notifications: Notification[];
  onMarkRead?: (documentId: string) => void;
  isMarking?: boolean;
}) {
  return (
    <ul data-slot="notification-list" className="flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationFeedItem
          key={notification.documentId}
          notification={notification}
          onMarkRead={onMarkRead}
          isMarking={isMarking}
        />
      ))}
    </ul>
  );
}

export { NotificationFeedList };
