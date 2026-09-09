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
import { type OpsOperation } from './core';
/**
 * Exported ON PURPOSE: the flags console's client form bound is sourced from
 * HERE rather than restated, so the client check and this read projection are
 * one number by construction. (The stored columns are unbounded text and the
 * write path imposes no length of its own — this projection's cap is what the
 * portal can render, and an editor that allowed past it would let an operator
 * save a banner the settings screen then refuses to show.)
 */
export declare const BANNER_MESSAGE_MAX = 600;
export declare const announcementLevelSchema: z.ZodEnum<{
    info: "info";
    warning: "warning";
    critical: "critical";
}>;
export type AnnouncementLevel = z.infer<typeof announcementLevelSchema>;
export declare const emailProviderSchema: z.ZodEnum<{
    smtp: "smtp";
    console: "console";
}>;
export type EmailProvider = z.infer<typeof emailProviderSchema>;
/**
 * Stored feature-flag overrides. `null` means "no overrides stored at all",
 * which is not the same as `{}` — an operator who cleared every override.
 */
export declare const featureFlagsSchema: z.ZodRecord<z.ZodString, z.ZodBoolean>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
/**
 * The ops projection of the platform-settings single type. Bounds mirror the
 * stored column bounds, so a row that somehow violates them is a server fault
 * the client refuses to render rather than a silently wrong screen.
 */
export declare const platformSettingsSchema: z.ZodObject<{
    documentId: z.ZodString;
    site_name: z.ZodString;
    site_tagline: z.ZodNullable<z.ZodString>;
    seo_default_title: z.ZodNullable<z.ZodString>;
    seo_default_description: z.ZodNullable<z.ZodString>;
    seo_default_og_image: z.ZodNullable<z.ZodString>;
    maintenance_mode: z.ZodBoolean;
    maintenance_message: z.ZodNullable<z.ZodString>;
    announcement_enabled: z.ZodBoolean;
    announcement_message: z.ZodNullable<z.ZodString>;
    announcement_level: z.ZodEnum<{
        info: "info";
        warning: "warning";
        critical: "critical";
    }>;
    session_timeout_minutes: z.ZodNumber;
    upload_max_size_mb: z.ZodNumber;
    pagination_default_page_size: z.ZodNumber;
    pagination_max_page_size: z.ZodNumber;
    email_provider: z.ZodEnum<{
        smtp: "smtp";
        console: "console";
    }>;
    email_from_name: z.ZodNullable<z.ZodString>;
    email_from_address: z.ZodNullable<z.ZodString>;
    email_reply_to: z.ZodNullable<z.ZodString>;
    rate_limit_auth_max: z.ZodNumber;
    rate_limit_auth_window_ms: z.ZodNumber;
    feature_flags: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    sitemap_generated_at: z.ZodNullable<z.ZodISODateTime>;
    last_backup_at: z.ZodNullable<z.ZodISODateTime>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
/**
 * The exact contracted key set, DERIVED from the schema rather than retyped —
 * a second hand-maintained list is precisely the drift this package exists to
 * prevent. Order follows the schema declaration.
 */
export declare const PLATFORM_SETTINGS_KEYS: readonly (keyof PlatformSettings)[];
/**
 * Key names that must NEVER appear in this projection. The single type shares a
 * row with deployment configuration, so the guard is on the key NAME, not on a
 * denylist of today's columns: a credential column added tomorrow is caught by
 * the same rule, without anyone remembering to extend a list.
 */
export declare const SETTINGS_SECRET_KEY_PATTERN: RegExp;
/**
 * Every key of `body` that the contract does not declare, plus any declared key
 * whose NAME reads as a credential. An empty array is the only acceptable
 * result for a real response; anything else is a leak or an undeclared field.
 */
export declare function leakedSettingsKeys(body: unknown): string[];
/**
 * The 200 body. `z.object` (not `z.strictObject`) at the envelope level on
 * purpose — see the file header: Strapi's `transformResponse` adds `meta`, and
 * the legacy baseline must keep working unchanged.
 */
export declare const settingsReadResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        site_name: z.ZodString;
        site_tagline: z.ZodNullable<z.ZodString>;
        seo_default_title: z.ZodNullable<z.ZodString>;
        seo_default_description: z.ZodNullable<z.ZodString>;
        seo_default_og_image: z.ZodNullable<z.ZodString>;
        maintenance_mode: z.ZodBoolean;
        maintenance_message: z.ZodNullable<z.ZodString>;
        announcement_enabled: z.ZodBoolean;
        announcement_message: z.ZodNullable<z.ZodString>;
        announcement_level: z.ZodEnum<{
            info: "info";
            warning: "warning";
            critical: "critical";
        }>;
        session_timeout_minutes: z.ZodNumber;
        upload_max_size_mb: z.ZodNumber;
        pagination_default_page_size: z.ZodNumber;
        pagination_max_page_size: z.ZodNumber;
        email_provider: z.ZodEnum<{
            smtp: "smtp";
            console: "console";
        }>;
        email_from_name: z.ZodNullable<z.ZodString>;
        email_from_address: z.ZodNullable<z.ZodString>;
        email_reply_to: z.ZodNullable<z.ZodString>;
        rate_limit_auth_max: z.ZodNumber;
        rate_limit_auth_window_ms: z.ZodNumber;
        feature_flags: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
        sitemap_generated_at: z.ZodNullable<z.ZodISODateTime>;
        last_backup_at: z.ZodNullable<z.ZodISODateTime>;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strict>;
}, z.core.$strip>;
export type SettingsReadResponse = z.infer<typeof settingsReadResponseSchema>;
/** A GET carries no body; an empty object is the only valid payload. */
export declare const settingsReadRequestSchema: z.ZodObject<{}, z.core.$strict>;
/** C-OPS-PORTAL-067 — GET /api/platform-settings */
export declare const SettingsReadOperation: OpsOperation<typeof settingsReadRequestSchema, typeof settingsReadResponseSchema>;
/**
 * C-SET-01's anonymous projection, listed here so a test can assert the two
 * projections stay DISJOINT where it matters: the ops-only keys below must
 * never appear in the public body, whatever the public route later adds.
 */
export declare const PUBLIC_PLATFORM_SETTINGS_KEYS: readonly string[];
/** Keys the ops read carries that an anonymous caller must never receive. */
export declare const OPS_ONLY_PLATFORM_SETTINGS_KEYS: readonly string[];
