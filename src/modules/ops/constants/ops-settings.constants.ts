import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';

/** One settings group = one card on the ops screen. */
export interface SettingsGroup {
  readonly id: string;
  readonly fields: readonly (keyof PlatformSettingsForm)[];
}

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
