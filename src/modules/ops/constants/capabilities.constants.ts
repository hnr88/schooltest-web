export const OPS_CAPABILITIES_QUERY_KEY = ['ops', 'capabilities'] as const;

export const CAPABILITIES_TRANSLATION_NAMESPACE = 'Ops.capabilities';

/**
 * The exact reference copy from `mvp/ops/Ops Portal.dc.html` — the read-only
 * banner at lines 60-64, the error-screen actions at lines 133-135 and the
 * offline strip at lines 51-58.
 *
 * These are the fallbacks the component renders until the `Ops.capabilities`
 * keys land in every locale file (one integrator owns `src/i18n/messages/*`).
 * `t.has()` picks the translation the moment it exists, so the pictured
 * English never regresses to a raw key path in the meantime.
 */
export const CAPABILITIES_COPY = {
  offlineTitle: 'You’re offline',
  offlineBody: 'Browsing cached data. Changes won’t save until the connection is back.',
  offlineRetry: 'Retry connection',
  readOnlyTitle: 'Read-only session',
  readOnlyBody:
    'Support accounts can view everything and export, but can’t change school data.',
  errorTitle: 'Couldn’t load your account',
  errorBody:
    'We couldn’t confirm what this account can do. Nothing is lost — try again, or check the status page.',
  retry: 'Try again',
  statusPage: 'Status page',
  statusPageUnset:
    'No status page is configured for this release. Set OPS_STATUS_PAGE_URL before sign-off.',
} as const;

export type CapabilitiesCopyKey = keyof typeof CAPABILITIES_COPY;
