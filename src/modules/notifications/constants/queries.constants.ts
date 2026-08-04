export const NOTIFICATION_PREFERENCES_QUERY_KEY = ['notification-preferences'] as const;

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export const SCHOOL_NOTIFICATIONS_QUERY_KEY = [
  ...NOTIFICATIONS_QUERY_KEY,
  'school-feed',
] as const;

export const VAPID_PUBLIC_KEY_QUERY_KEY = ['push-subscriptions', 'vapid-public-key'] as const;
