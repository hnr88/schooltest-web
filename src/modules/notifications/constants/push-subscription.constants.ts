import type { StatusPillTone } from '@/modules/design-system';
import type { BrowserPushStatus } from '@/modules/notifications/types/push-subscription.types';

// §02 StatusPill tones — the canonical row/hero state pill. Every pair below is one
// of the design system's AA-verified soft-tint/ink combinations, so a status can
// never be the only thing carrying meaning at 3:1.
export const PUSH_STATUS_CONFIG = {
  checking: { labelKey: 'notificationPreferences.push.status.checking', tone: 'neutral' },
  ready: { labelKey: 'notificationPreferences.push.status.ready', tone: 'info' },
  subscribed: { labelKey: 'notificationPreferences.push.status.subscribed', tone: 'success' },
  unsupported: { labelKey: 'notificationPreferences.push.status.unsupported', tone: 'warning' },
  'permission-denied': {
    labelKey: 'notificationPreferences.push.status.permissionDenied',
    tone: 'warning',
  },
  'not-configured': {
    labelKey: 'notificationPreferences.push.status.notConfigured',
    tone: 'warning',
  },
  error: { labelKey: 'notificationPreferences.push.status.error', tone: 'danger' },
} as const satisfies Record<BrowserPushStatus, { labelKey: string; tone: StatusPillTone }>;
