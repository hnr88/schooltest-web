'use client';

import { useNow } from 'next-intl';

import { NotificationDayHeading } from '@/modules/notifications/components/NotificationDayHeading';
import { NotificationFeedItem } from '@/modules/notifications/components/NotificationFeedItem';
import { groupNotificationsByDay } from '@/modules/notifications/lib/notification-grouping';
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
  const now = useNow();
  const groups = groupNotificationsByDay(notifications, now);

  return (
    <div data-slot="notification-list" className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <NotificationDayHeading date={group.date} dayOffset={group.dayOffset} />
          <ul className="flex flex-col gap-2">
            {group.notifications.map((notification) => (
              <NotificationFeedItem
                key={notification.documentId}
                notification={notification}
                onMarkRead={onMarkRead}
                isMarking={isMarking}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export { NotificationFeedList };
