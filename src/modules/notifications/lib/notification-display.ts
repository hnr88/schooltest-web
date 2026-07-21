import type { NotificationCategory } from '@/modules/notifications/types/notification.types';

const CATEGORY_TILE_CLASSES: Record<NotificationCategory, string> = {
  account: 'bg-blue-50 text-blue-700 dark:bg-blue-950',
  security: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  children: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300',
  testActivity: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  testResults: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
};

export function getNotificationTileClass(category: NotificationCategory): string {
  return CATEGORY_TILE_CLASSES[category];
}
