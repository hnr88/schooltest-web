import type {
  Notification,
  NotificationRecencyGroup,
} from '@/modules/notifications/types/notification.types';

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDayOffset(date: Date, now: Date): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS);
}

// The portal feed has exactly two groups — `Today` and `Earlier` (spec 03 §5.1).
// An empty group is dropped so the card never draws a bare eyebrow.
export function groupNotificationsByRecency(
  notifications: Notification[],
  now: Date,
): NotificationRecencyGroup[] {
  const today: Notification[] = [];
  const earlier: Notification[] = [];

  for (const notification of notifications) {
    const bucket = getDayOffset(new Date(notification.createdAt), now) === 0 ? today : earlier;
    bucket.push(notification);
  }

  return [
    { key: 'today' as const, notifications: today },
    { key: 'earlier' as const, notifications: earlier },
  ].filter((group) => group.notifications.length > 0);
}
