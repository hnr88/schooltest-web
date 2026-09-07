import { z } from 'zod';

/**
 * C-SET-02/03, C-OPS-PORTAL-067.
 *
 * `platformSettingsSchema` MIRRORS `platformSettingsSchema` in
 * `mvp/contracts/ops/src/settings-read.ts`, key for key and bound for bound,
 * and `tests/e2e/ops-portal/settings-read.spec.ts` fails the moment the two
 * disagree — on the key set, on strictness, or on what either accepts and
 * rejects for the live payload. It is a mirror rather than a re-export for one
 * mechanical reason: the shared package's own `node_modules` carries a
 * different zod build from this app's, so importing the module SOURCE by
 * relative path makes every schema type incompatible here.
 *
 * INTEGRATOR: once `@schooltest/ops-contracts` is rebuilt with the new
 * `settings-read` module (the barrel already re-exports it), the package
 * specifier resolves this app's zod correctly and the block below collapses to
 *
 *   export { platformSettingsSchema, featureFlagsSchema } from '@schooltest/ops-contracts';
 *
 * with no other change: every web consumer already imports it through here.
 */
export const featureFlagsSchema = z.record(z.string().min(1), z.boolean());

export const platformSettingsSchema = z.strictObject({
  documentId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  site_name: z.string().min(1).max(120),
  site_tagline: z.string().max(200).nullable(),
  seo_default_title: z.string().max(70).nullable(),
  seo_default_description: z.string().max(200).nullable(),
  seo_default_og_image: z.string().max(2048).nullable(),
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().max(600).nullable(),
  announcement_enabled: z.boolean(),
  announcement_message: z.string().max(600).nullable(),
  announcement_level: z.enum(['info', 'warning', 'critical']),
  session_timeout_minutes: z.number().int().min(5).max(1440),
  upload_max_size_mb: z.number().int().min(1).max(100),
  pagination_default_page_size: z.number().int().min(1).max(100),
  pagination_max_page_size: z.number().int().min(1).max(200),
  email_provider: z.enum(['smtp', 'console']),
  email_from_name: z.string().max(120).nullable(),
  email_from_address: z.string().max(255).nullable(),
  email_reply_to: z.string().max(255).nullable(),
  rate_limit_auth_max: z.number().int().min(1).max(1000),
  rate_limit_auth_window_ms: z.number().int().min(1000).max(3600000),
  feature_flags: featureFlagsSchema.nullable(),
  sitemap_generated_at: z.iso.datetime().nullable(),
  last_backup_at: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

// The FORM schema describes what this screen may SUBMIT, not what the server
// returns, so it stays local. The bounds mirror the server's write schema
// (schooltest-api/src/api/platform-setting/lib/settings-validation.ts) so the
// form refuses locally what the API would refuse remotely — and the server
// stays the authority: its 400 details.errors are mapped back onto the fields.
//
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
