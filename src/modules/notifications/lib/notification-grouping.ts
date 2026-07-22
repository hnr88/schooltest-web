import type { Notification } from '@/modules/notifications/types/notification.types';

const DAY_MS = 86_400_000;

export interface NotificationDayGroup {
  key: string;
  date: Date;
  dayOffset: number;
  notifications: Notification[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDayOffset(date: Date, now: Date): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS);
}

export function groupNotificationsByDay(
  notifications: Notification[],
  now: Date,
): NotificationDayGroup[] {
  const groups = new Map<string, NotificationDayGroup>();

  for (const notification of notifications) {
    const date = new Date(notification.createdAt);
    const key = startOfDay(date).toISOString();
    const group = groups.get(key);

    if (group) {
      group.notifications.push(notification);
      continue;
    }

    groups.set(key, {
      key,
      date,
      dayOffset: getDayOffset(date, now),
      notifications: [notification],
    });
  }

  return [...groups.values()];
}
