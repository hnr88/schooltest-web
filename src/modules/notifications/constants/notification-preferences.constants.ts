import type {
  NotificationPreferenceEventConfig,
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

// The wire enum — mirrors the backend DIGEST_FREQUENCIES contract
// (schooltest-api/src/api/notification-preference/lib/notification-preference.constants.ts).
// The schema rejects anything outside this set, so the two can never drift silently.
export const NOTIFICATION_DIGEST_FREQUENCIES = ['immediate', 'daily', 'weekly', 'off'] as const;

export const NOTIFICATION_PREFERENCE_DEFAULTS: NotificationPreferenceFormValues = {
  emailEnabled: true,
  smsEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  digestFrequency: 'immediate',
  eventPreferences: {
    test_results_ready: true,
    test_results_updated: true,
    session_completed: true,
    session_started: true,
    student_created: true,
    student_email_fix_requested: true,
  },
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

/**
 * Row 05 (D-01) — per-EVENT switches, replacing the three category toggles.
 * The design (`Parent Portal.dc.html:653-664`) draws event rows, each bundling
 * its channels in prose; the channel switches above stay the global master per
 * transport. Order matches the design's reading order, results first.
 */
export const NOTIFICATION_EVENT_TOGGLES: readonly NotificationPreferenceEventConfig[] = [
  {
    event: 'test_results_ready',
    titleKey: 'notificationPreferences.events.testResultsReady.title',
    descriptionKey: 'notificationPreferences.events.testResultsReady.description',
  },
  {
    event: 'test_results_updated',
    titleKey: 'notificationPreferences.events.testResultsUpdated.title',
    descriptionKey: 'notificationPreferences.events.testResultsUpdated.description',
  },
  {
    event: 'session_completed',
    titleKey: 'notificationPreferences.events.sessionCompleted.title',
    descriptionKey: 'notificationPreferences.events.sessionCompleted.description',
  },
  {
    event: 'session_started',
    titleKey: 'notificationPreferences.events.sessionStarted.title',
    descriptionKey: 'notificationPreferences.events.sessionStarted.description',
  },
  {
    event: 'student_created',
    titleKey: 'notificationPreferences.events.studentCreated.title',
    descriptionKey: 'notificationPreferences.events.studentCreated.description',
  },
  {
    event: 'student_email_fix_requested',
    titleKey: 'notificationPreferences.events.studentEmailFix.title',
    descriptionKey: 'notificationPreferences.events.studentEmailFix.description',
  },
];

/** category -> its events, so a legacy row's category can seed the six switches. */
export const NOTIFICATION_EVENTS_BY_CATEGORY: Readonly<Record<string, readonly string[]>> = {
  children: ['student_created', 'student_email_fix_requested'],
  testActivity: ['session_started', 'session_completed'],
  testResults: ['test_results_ready', 'test_results_updated'],
};

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
