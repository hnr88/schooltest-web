'use client';

import { useNow, useTranslations } from 'next-intl';

import { NotificationFeedItem } from '@/modules/notifications/components/NotificationFeedItem';
import { groupNotificationsByRecency } from '@/modules/notifications/lib/notification-grouping';
import type { Notification } from '@/modules/notifications/types/notification.types';
import { GROUP_HEADING_CLASS } from '@/modules/notifications/constants/components.constants';

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
  const t = useTranslations('Notifications');
  const groups = groupNotificationsByRecency(notifications, now);

  return (
    <div data-slot="notification-list" className="flex flex-col">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className={GROUP_HEADING_CLASS}>{t(group.key)}</h2>
          <ul className="flex flex-col">
            {group.notifications.map((notification) => (
              <NotificationFeedItem
                key={notification.documentId}
                notification={notification}
                now={now}
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
