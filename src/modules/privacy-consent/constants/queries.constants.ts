export const CONSENT_CONFIG_QUERY_KEY = ['privacy-consent', 'config'] as const;

export const STUDENT_CONSENTS_QUERY_KEY = ['privacy-consent', 'student-consents'] as const;

// The switches change by an ops toggle, not by anything a person does on this page,
// so the config is read once and kept for ten minutes.
export const CONSENT_CONFIG_STALE_TIME_MS = 10 * 60 * 1000;
