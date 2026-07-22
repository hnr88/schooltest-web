import type {
  NotificationPreferenceFormValues,
  NotificationPreferenceLockedConfig,
  NotificationPreferenceToggleConfig,
} from '@/modules/notifications/types/notification-preference.types';

// Canonical in-card section label (DS component sheets): 11.5px/700 uppercase,
// .08em tracking. Drawn at slate-600, not the canonical slate-400: axe flags
// #94A3B8 label text on white as a serious contrast failure. The margin is
// explicit because a <legend> is not a flex item — the fieldset gap skips it.
export const NOTIFICATION_SECTION_LABEL_CLASS =
  'mb-2 text-overline font-bold tracking-rail text-slate-600 uppercase';

// PortalSelect (.qa/design/spec/03 §1.4): 48px tall, radius 12, #D8DFEA border,
// 12px side padding, 14px navy ink on #FFFFFF, focus border #2563EB. The
// `data-[size=default]` variant is repeated on purpose — the vendored trigger
// declares its 32px height behind that variant, so a plain `h-12` loses on
// specificity and silently does nothing.
export const NOTIFICATION_SELECT_TRIGGER_CLASS =
  'min-h-12 w-full justify-between rounded-tile border-portal-input bg-card px-3 text-body-md font-medium text-foreground transition-colors duration-200 ease-out-expo hover:border-foreground data-[size=default]:h-12 motion-reduce:transition-none';

export const NOTIFICATION_DIGEST_FREQUENCIES = ['immediate', 'daily', 'weekly', 'off'] as const;

export const NOTIFICATION_DIGEST_SELECTABLE_FREQUENCIES = ['immediate', 'off'] as const;

export const NOTIFICATION_PREFERENCE_DEFAULTS: NotificationPreferenceFormValues = {
  emailEnabled: true,
  smsEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  children: true,
  testActivity: true,
  testResults: true,
  digestFrequency: 'immediate',
};

export const NOTIFICATION_CHANNEL_TOGGLES: readonly NotificationPreferenceToggleConfig[] = [
  {
    field: 'emailEnabled',
    titleKey: 'notificationPreferences.channels.email.title',
    descriptionKey: 'notificationPreferences.channels.email.description',
  },
  {
    field: 'inAppEnabled',
    titleKey: 'notificationPreferences.channels.inApp.title',
    descriptionKey: 'notificationPreferences.channels.inApp.description',
  },
  {
    field: 'pushEnabled',
    titleKey: 'notificationPreferences.channels.push.title',
    descriptionKey: 'notificationPreferences.channels.push.description',
  },
  {
    field: 'smsEnabled',
    titleKey: 'notificationPreferences.channels.sms.title',
    descriptionKey: 'notificationPreferences.channels.sms.description',
    helperKey: 'notificationPreferences.channels.sms.blocked',
  },
];

export const NOTIFICATION_CATEGORY_TOGGLES: readonly NotificationPreferenceToggleConfig[] = [
  {
    field: 'children',
    titleKey: 'notificationPreferences.categories.children.title',
    descriptionKey: 'notificationPreferences.categories.children.description',
  },
  {
    field: 'testActivity',
    titleKey: 'notificationPreferences.categories.testActivity.title',
    descriptionKey: 'notificationPreferences.categories.testActivity.description',
  },
  {
    field: 'testResults',
    titleKey: 'notificationPreferences.categories.testResults.title',
    descriptionKey: 'notificationPreferences.categories.testResults.description',
  },
];

export const NOTIFICATION_LOCKED_CATEGORIES: readonly NotificationPreferenceLockedConfig[] = [
  {
    field: 'security',
    titleKey: 'notificationPreferences.categories.security.title',
    descriptionKey: 'notificationPreferences.categories.security.description',
  },
  {
    field: 'account',
    titleKey: 'notificationPreferences.categories.account.title',
    descriptionKey: 'notificationPreferences.categories.account.description',
  },
];
