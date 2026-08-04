import { getDayOffset } from '@/modules/notifications/lib/notification-grouping';
import type {
  NotificationCategory,
  NotificationTimeTier,
} from '@/modules/notifications/types/notification.types';
import { CATEGORY_TILE_CLASSES, DAY_MS, WEEK_DAYS } from '@/modules/notifications/constants/lib.constants';

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
