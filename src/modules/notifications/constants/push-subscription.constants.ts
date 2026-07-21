import type { BrowserPushStatus } from '@/modules/notifications/types/push-subscription.types';

export const PUSH_STATUS_CONFIG = {
  checking: { labelKey: 'notificationPreferences.push.status.checking', variant: 'default' },
  ready: { labelKey: 'notificationPreferences.push.status.ready', variant: 'accent' },
  subscribed: { labelKey: 'notificationPreferences.push.status.subscribed', variant: 'success' },
  unsupported: { labelKey: 'notificationPreferences.push.status.unsupported', variant: 'warning' },
  'permission-denied': {
    labelKey: 'notificationPreferences.push.status.permissionDenied',
    variant: 'warning',
  },
  'not-configured': {
    labelKey: 'notificationPreferences.push.status.notConfigured',
    variant: 'warning',
  },
  error: { labelKey: 'notificationPreferences.push.status.error', variant: 'error' },
} as const satisfies Record<
  BrowserPushStatus,
  { labelKey: string; variant: 'default' | 'accent' | 'success' | 'warning' | 'error' }
>;
