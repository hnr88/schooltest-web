/**
 * C-OPS-PORTAL-067 — GET /api/platform-settings (OPS-077).
 *
 * ONE definition of the ops platform-settings read, imported by the typed web
 * client and by both HTTP suites, so the wire shape cannot drift between the
 * server that emits it and the screen that renders it.
 *
 * Three properties this module exists to hold:
 *
 *  - The projection is an ALLOW-LIST. `platformSettingsSchema` is STRICT, so a
 *    column added to the single type later — an SMTP password, a provider API
 *    key — fails the parse instead of arriving in an operator's browser. The
 *    same row already holds email configuration, rate limits and feature flags,
 *    which is exactly why a filtered spread was never acceptable here.
 *
 *  - Null is not "". Every optional column is `string | null`; an empty string
 *    is a real stored value and stays distinguishable from a cleared column, so
 *    a form can tell "never set" from "deliberately blank".
 *
 *  - The envelope is deliberately NOT strict at the TOP level. The existing ops
 *    read answers through Strapi's `transformResponse`, which appends `meta`.
 *    Rejecting that would break the unversioned baseline this operation must
 *    preserve, so unknown transport keys are tolerated while `data` itself is
 *    validated exactly as contracted.
 */
import { z } from 'zod';

import { documentIdSchema, type OpsOperation } from './core';

const SITE_NAME_MAX = 120;
const TAGLINE_MAX = 200;
const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 200;
const OG_IMAGE_MAX = 2048;
/**
 * Exported ON PURPOSE: the flags console's client form bound is sourced from
 * HERE rather than restated, so the client check and this read projection are
 * one number by construction. (The stored columns are unbounded text and the
 * write path imposes no length of its own — this projection's cap is what the
 * portal can render, and an editor that allowed past it would let an operator
 * save a banner the settings screen then refuses to show.)
 */
export const BANNER_MESSAGE_MAX = 600;
const FROM_NAME_MAX = 120;
const ADDRESS_MAX = 255;

/** ISO-8601 instant, exactly as Strapi serialises a `datetime` column. */
const timestampSchema = z.iso.datetime();

export const announcementLevelSchema = z.enum(['info', 'warning', 'critical']);
export type AnnouncementLevel = z.infer<typeof announcementLevelSchema>;

export const emailProviderSchema = z.enum(['smtp', 'console']);
export type EmailProvider = z.infer<typeof emailProviderSchema>;

/**
 * Stored feature-flag overrides. `null` means "no overrides stored at all",
 * which is not the same as `{}` — an operator who cleared every override.
 */
export const featureFlagsSchema = z.record(z.string().min(1), z.boolean());
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

/**
 * The ops projection of the platform-settings single type. Bounds mirror the
 * stored column bounds, so a row that somehow violates them is a server fault
 * the client refuses to render rather than a silently wrong screen.
 */
export const platformSettingsSchema = z.strictObject({
  documentId: documentIdSchema,
  site_name: z.string().min(1).max(SITE_NAME_MAX),
  site_tagline: z.string().max(TAGLINE_MAX).nullable(),
  seo_default_title: z.string().max(SEO_TITLE_MAX).nullable(),
  seo_default_description: z.string().max(SEO_DESCRIPTION_MAX).nullable(),
  seo_default_og_image: z.string().max(OG_IMAGE_MAX).nullable(),
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().max(BANNER_MESSAGE_MAX).nullable(),
  announcement_enabled: z.boolean(),
  announcement_message: z.string().max(BANNER_MESSAGE_MAX).nullable(),
  announcement_level: announcementLevelSchema,
  session_timeout_minutes: z.number().int().min(5).max(1440),
  upload_max_size_mb: z.number().int().min(1).max(100),
  pagination_default_page_size: z.number().int().min(1).max(100),
  pagination_max_page_size: z.number().int().min(1).max(200),
  email_provider: emailProviderSchema,
  email_from_name: z.string().max(FROM_NAME_MAX).nullable(),
  email_from_address: z.string().max(ADDRESS_MAX).nullable(),
  email_reply_to: z.string().max(ADDRESS_MAX).nullable(),
  rate_limit_auth_max: z.number().int().min(1).max(1000),
  rate_limit_auth_window_ms: z.number().int().min(1000).max(3600000),
  feature_flags: featureFlagsSchema.nullable(),
  sitemap_generated_at: timestampSchema.nullable(),
  last_backup_at: timestampSchema.nullable(),
  updatedAt: timestampSchema,
});
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

/**
 * The exact contracted key set, DERIVED from the schema rather than retyped —
 * a second hand-maintained list is precisely the drift this package exists to
 * prevent. Order follows the schema declaration.
 */
export const PLATFORM_SETTINGS_KEYS: readonly (keyof PlatformSettings)[] = Object.freeze(
  Object.keys(platformSettingsSchema.shape) as (keyof PlatformSettings)[],
);

/**
 * Key names that must NEVER appear in this projection. The single type shares a
 * row with deployment configuration, so the guard is on the key NAME, not on a
 * denylist of today's columns: a credential column added tomorrow is caught by
 * the same rule, without anyone remembering to extend a list.
 */
export const SETTINGS_SECRET_KEY_PATTERN = /(pass|secret|token|credential|api[_-]?key)/i;

/**
 * Every key of `body` that the contract does not declare, plus any declared key
 * whose NAME reads as a credential. An empty array is the only acceptable
 * result for a real response; anything else is a leak or an undeclared field.
 */
export function leakedSettingsKeys(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return [];
  const declared = new Set<string>(PLATFORM_SETTINGS_KEYS);
  return Object.keys(body).filter(
    (key) => !declared.has(key) || SETTINGS_SECRET_KEY_PATTERN.test(key),
  );
}

/**
 * The 200 body. `z.object` (not `z.strictObject`) at the envelope level on
 * purpose — see the file header: Strapi's `transformResponse` adds `meta`, and
 * the legacy baseline must keep working unchanged.
 */
export const settingsReadResponseSchema = z.object({ data: platformSettingsSchema });
export type SettingsReadResponse = z.infer<typeof settingsReadResponseSchema>;

/** A GET carries no body; an empty object is the only valid payload. */
export const settingsReadRequestSchema = z.strictObject({});

/** C-OPS-PORTAL-067 — GET /api/platform-settings */
export const SettingsReadOperation: OpsOperation<
  typeof settingsReadRequestSchema,
  typeof settingsReadResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-067',
  method: 'GET',
  path: '/api/platform-settings',
  request: settingsReadRequestSchema,
  response: settingsReadResponseSchema,
  success: 200,
  errors: Object.freeze([400, 401, 403, 404, 429, 500]),
});

/**
 * C-SET-01's anonymous projection, listed here so a test can assert the two
 * projections stay DISJOINT where it matters: the ops-only keys below must
 * never appear in the public body, whatever the public route later adds.
 */
export const PUBLIC_PLATFORM_SETTINGS_KEYS: readonly string[] = Object.freeze([
  'site_name',
  'site_tagline',
  'seo_default_title',
  'seo_default_description',
  'seo_default_og_image',
  'maintenance_mode',
  'maintenance_message',
  'announcement_enabled',
  'announcement_message',
  'announcement_level',
  'pagination_default_page_size',
]);

/** Keys the ops read carries that an anonymous caller must never receive. */
export const OPS_ONLY_PLATFORM_SETTINGS_KEYS: readonly string[] = Object.freeze(
  PLATFORM_SETTINGS_KEYS.filter((key) => !PUBLIC_PLATFORM_SETTINGS_KEYS.includes(key)),
);
