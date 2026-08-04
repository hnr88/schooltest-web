import { z } from 'zod';

// C-SET-02/03. The bounds MIRROR the server's Zod schema exactly
// (schooltest-api/src/api/platform-setting/lib/settings-validation.ts) so the
// form refuses locally what the API would refuse remotely — and the server
// stays the authority: its 400 details.errors are mapped back onto the fields.

export const featureFlagsSchema = z.record(z.string(), z.boolean());

export const platformSettingsSchema = z.object({
  documentId: z.string(),
  site_name: z.string(),
  site_tagline: z.string().nullable(),
  seo_default_title: z.string().nullable(),
  seo_default_description: z.string().nullable(),
  seo_default_og_image: z.string().nullable(),
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().nullable(),
  announcement_enabled: z.boolean(),
  announcement_message: z.string().nullable(),
  announcement_level: z.enum(['info', 'warning', 'critical']),
  session_timeout_minutes: z.number(),
  upload_max_size_mb: z.number(),
  pagination_default_page_size: z.number(),
  pagination_max_page_size: z.number(),
  email_provider: z.enum(['smtp', 'console']),
  email_from_name: z.string().nullable(),
  email_from_address: z.string().nullable(),
  email_reply_to: z.string().nullable(),
  rate_limit_auth_max: z.number(),
  rate_limit_auth_window_ms: z.number(),
  feature_flags: featureFlagsSchema.nullable(),
  sitemap_generated_at: z.string().nullable(),
  last_backup_at: z.string().nullable(),
  updatedAt: z.string(),
});

// `z.number()`, not `z.coerce.number()`: coercion makes the schema's INPUT type
// `unknown`, which breaks react-hook-form's resolver generic. The number inputs
// register with `valueAsNumber` instead, so the form value is already a number.
export const platformSettingsFormSchema = z.object({
  site_name: z.string().trim().min(1).max(120),
  site_tagline: z.string().trim().max(200),
  seo_default_title: z.string().trim().max(70),
  seo_default_description: z.string().trim().max(200),
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().trim().max(600),
  announcement_enabled: z.boolean(),
  announcement_message: z.string().trim().max(600),
  announcement_level: z.enum(['info', 'warning', 'critical']),
  session_timeout_minutes: z.number().int().min(5).max(1440),
  upload_max_size_mb: z.number().int().min(1).max(100),
  pagination_default_page_size: z.number().int().min(1).max(100),
  pagination_max_page_size: z.number().int().min(1).max(200),
  email_provider: z.enum(['smtp', 'console']),
  email_from_name: z.string().trim().max(120),
  email_from_address: z.string().trim().max(255),
  email_reply_to: z.string().trim().max(255),
  rate_limit_auth_max: z.number().int().min(1).max(1000),
  rate_limit_auth_window_ms: z.number().int().min(1000).max(3600000),
});

export const testEmailResultSchema = z.object({
  sent: z.literal(true),
  to: z.string(),
  subject: z.string(),
  provider: z.string(),
});
