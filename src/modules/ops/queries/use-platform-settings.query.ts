'use client';

/**
 * C-SET-02 / C-OPS-PORTAL-067 — the historical name for the settings read.
 *
 * The implementation moved to `use-settings-read.query.ts` (OPS-077) so the
 * operation has exactly one fetcher, one query key and one contract parse. This
 * file stays as the published name: the ops barrel and the settings form hook
 * import `usePlatformSettingsQuery`, and a second hook against the same
 * endpoint would be a duplicate service, not a migration.
 */
export { useSettingsReadQuery as usePlatformSettingsQuery } from './use-settings-read.query';
