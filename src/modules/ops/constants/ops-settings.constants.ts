import type { SettingsGroup } from '@/modules/ops/types/constants.types';

import { REVALIDATE_TAGS } from '@/modules/seo/constants/schemas.constants';

import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';

/** One settings group = one card on the ops screen. */
/**
 * The ops settings screen, grouped the way an operator thinks about it. Every
 * field here is writable through C-SET-03; read-only operational stamps
 * (sitemap_generated_at, last_backup_at) are shown separately, not in a form.
 */
export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  { id: 'site', fields: ['site_name', 'site_tagline'] },
  { id: 'seo', fields: ['seo_default_title', 'seo_default_description'] },
  {
    id: 'email',
    fields: ['email_provider', 'email_from_name', 'email_from_address', 'email_reply_to'],
  },
  {
    id: 'limits',
    fields: [
      'session_timeout_minutes',
      'upload_max_size_mb',
      'pagination_default_page_size',
      'pagination_max_page_size',
      'rate_limit_auth_max',
      'rate_limit_auth_window_ms',
    ],
  },
  { id: 'maintenance', fields: ['maintenance_mode', 'maintenance_message'] },
  {
    id: 'announcement',
    fields: ['announcement_enabled', 'announcement_message', 'announcement_level'],
  },
];

/** Rendering shape per field — the DS control the value needs. */
export const SETTINGS_FIELD_KINDS: Readonly<
  Record<keyof PlatformSettingsForm, 'text' | 'textarea' | 'number' | 'switch' | 'select'>
> = {
  site_name: 'text',
  site_tagline: 'textarea',
  seo_default_title: 'text',
  seo_default_description: 'textarea',
  maintenance_mode: 'switch',
  maintenance_message: 'textarea',
  announcement_enabled: 'switch',
  announcement_message: 'textarea',
  announcement_level: 'select',
  session_timeout_minutes: 'number',
  upload_max_size_mb: 'number',
  pagination_default_page_size: 'number',
  pagination_max_page_size: 'number',
  email_provider: 'select',
  email_from_name: 'text',
  email_from_address: 'text',
  email_reply_to: 'text',
  rate_limit_auth_max: 'number',
  rate_limit_auth_window_ms: 'number',
};

export const SETTINGS_SELECT_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  announcement_level: ['info', 'warning', 'critical'],
  email_provider: ['smtp', 'console'],
};

/**
 * Ledger 9 — the cache tag the announcement editor invalidates on save.
 *
 * Typed against the seo module's canonical `REVALIDATE_TAGS` union rather than
 * written as a bare string, so renaming the tag there breaks this build instead
 * of silently leaving the public banner stale. Imported from the constants FILE
 * and not the seo barrel: that barrel re-exports React Server Components, and
 * this constant is consumed by a server action.
 */
export const PLATFORM_SETTINGS_REVALIDATE_TAG: (typeof REVALIDATE_TAGS)[number] =
  'platform-settings';

/**
 * Ledger 10 (D-008) — the cache tag the legal-document editor invalidates on
 * save. Same discipline as the ledger-9 tag above: typed against the seo
 * module's canonical `REVALIDATE_TAGS` union, imported from the constants FILE
 * (the seo barrel carries server components this constant's server-action
 * consumer must not pull in). The public legal pages read through
 * `LEGAL_CACHE_TAG` in `@/modules/legal` with `revalidate: 300`; invalidating
 * this tag after a real 200 is what makes an edit visible immediately.
 */
export const LEGAL_DOCUMENTS_REVALIDATE_TAG: (typeof REVALIDATE_TAGS)[number] =
  'legal-documents';
