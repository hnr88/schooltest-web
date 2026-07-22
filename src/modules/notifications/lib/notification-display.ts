import { getDayOffset } from '@/modules/notifications/lib/notification-grouping';
import type {
  NotificationCategory,
  NotificationTimeTier,
} from '@/modules/notifications/types/notification.types';

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;

const CATEGORY_TILE_CLASSES: Record<NotificationCategory, string> = {
  account: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  security: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  children: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  testActivity: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  testResults: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
};

export function getNotificationTileClass(category: NotificationCategory): string {
  return CATEGORY_TILE_CLASSES[category];
}

// Portal feed glyph tile (spec 03 §5.1 "Row states"): the tint is driven by READ
// state, not by category — unread is the solid navy tile with white ink, read is the
// #EEF1F6 tile with navy ink.
export function getNotificationFeedTileClass(isUnread: boolean): string {
  return isUnread ? 'bg-foreground text-primary-foreground' : 'bg-divider text-foreground';
}

// Three-tier timestamp (§7): relative inside 24h → weekday name inside a week →
// absolute day + month beyond that.
export function getNotificationTimeTier(date: Date, now: Date): NotificationTimeTier {
  if (now.getTime() - date.getTime() < DAY_MS) return 'relative';
  return getDayOffset(date, now) < WEEK_DAYS ? 'weekday' : 'date';
}
