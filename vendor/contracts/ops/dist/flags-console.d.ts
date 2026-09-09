/**
 * C-OPSF-01..05 — the ops Flags console: `GET /api/ops/flags`,
 * `PUT /api/ops/flags/:key`, and the three dedicated settings actions
 * `PUT /api/ops/settings/{maintenance,announcement,rate-limit}`.
 *
 * Every shape was READ OFF THE LIVE ROUTES (curl against 127.0.0.1:5500) and
 * cross-checked against `schooltest-api/src/api/ops/{controllers,services}/flags.ts`
 * plus the platform-setting content type. The things worth knowing:
 *
 *  - the registry is CLOSED. `KNOWN_FLAG_KEYS` server-side is the authority and
 *    an unknown key is a 400 that enumerates the known ones, so the console
 *    renders the server's list and never free-types a key.
 *  - the three settings actions do NOT return the whole settings row. Each
 *    returns only the fields it owns, which is why they are modelled as three
 *    narrow responses rather than one shared PlatformSettings shape.
 *  - the two `*_message` fields are NULLABLE: the columns carry no `required`
 *    flag and the controller's `optionalText` accepts an explicit `null`, so
 *    clearing a message is a legitimate write and the contract must admit it.
 *    The booleans and integers in these responses are NOT nullable — each is a
 *    value the setter itself just wrote, and the setter only writes concrete
 *    values (the controller rejects anything else with a 400 first).
 *  - the numeric bounds are enforced TWICE server-side, in the controller
 *    (`max` 1..1000, `window_ms` 1000..3_600_000) and again by the content
 *    type's own min/max. The constants below mirror both, so a client-side
 *    check cannot drift into permitting what the server refuses.
 *  - `window_ms` is the wire name. The controller also accepts `windowMs` as a
 *    fallback (`body.window_ms ?? body.windowMs`); this contract commits to the
 *    snake_case form because that is what the response uses, and sending one
 *    name for two directions is how the pair stays legible.
 *
 * The pagination-style local declaration pattern of the other modules does not
 * apply here — none of these five routes paginates.
 */
import { z } from 'zod';
import type { OpsOperation } from './core';
import { type AnnouncementLevel } from './settings-read';
/** The controller's own ceilings for the rate-limit pair, mirrored exactly. */
export declare const RATE_LIMIT_MAX_MIN = 1;
export declare const RATE_LIMIT_MAX_MAX = 1000;
export declare const RATE_LIMIT_WINDOW_MIN_MS = 1000;
export declare const RATE_LIMIT_WINDOW_MAX_MS = 3600000;
/**
 * The announcement levels the controller admits (anything else is a 400 naming
 * these three), derived from the reused schema so there is ONE source of truth
 * rather than an array that can drift from the enum beside it.
 */
export declare const ANNOUNCEMENT_LEVELS: ("info" | "warning" | "critical")[];
export type { AnnouncementLevel };
/**
 * The app's real feature flags, as the server's closed registry defines them.
 * Listed here so a client can reason about a key it has not fetched yet; the
 * SERVER list is still the authority and the console renders what it returns.
 */
export declare const KNOWN_FLAG_KEYS: readonly ["parent_views_enabled", "maintenance_banner", "ops_destructive_actions"];
export type KnownFlagKey = (typeof KNOWN_FLAG_KEYS)[number];
/**
 * One registry row. `key` is deliberately a plain bounded string rather than
 * the enum above: the server owns the registry, and a newly shipped flag must
 * RENDER rather than fail the contract on a console that has not been rebuilt.
 */
export declare const flagRowSchema: z.ZodObject<{
    key: z.ZodString;
    description: z.ZodString;
    enabled: z.ZodBoolean;
}, z.core.$strict>;
export type FlagRow = z.infer<typeof flagRowSchema>;
export declare const flagsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        description: z.ZodString;
        enabled: z.ZodBoolean;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type FlagsResponse = z.infer<typeof flagsResponseSchema>;
/** The toggle takes a REQUIRED boolean — there is no "flip it" verb. */
export declare const flagToggleBodySchema: z.ZodObject<{
    enabled: z.ZodBoolean;
}, z.core.$strict>;
export type FlagToggleBody = z.infer<typeof flagToggleBodySchema>;
/** The ack echoes the key and its new value, not the whole registry. */
export declare const flagToggleResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        key: z.ZodString;
        enabled: z.ZodBoolean;
    }, z.core.$strict>;
}, z.core.$strict>;
export type FlagToggleResponse = z.infer<typeof flagToggleResponseSchema>;
export declare const maintenanceBodySchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type MaintenanceBody = z.infer<typeof maintenanceBodySchema>;
export declare const maintenanceResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        maintenance_mode: z.ZodBoolean;
        maintenance_message: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type MaintenanceResponse = z.infer<typeof maintenanceResponseSchema>;
export declare const announcementBodySchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    level: z.ZodOptional<z.ZodEnum<{
        info: "info";
        warning: "warning";
        critical: "critical";
    }>>;
}, z.core.$strict>;
export type AnnouncementBody = z.infer<typeof announcementBodySchema>;
/**
 * `announcement_level` is NON-nullable here, matching `./settings-read`'s
 * `settingsReadSchema` rather than the column's bare nullability: that sibling
 * schema already parses this field off the live settings route in production,
 * so the empirical answer is that the default keeps it populated. Two contracts
 * disagreeing about one field is worse than either choice, so this follows the
 * one with live evidence behind it. The messages stay nullable because clearing
 * one is a real, supported write.
 */
export declare const announcementResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        announcement_enabled: z.ZodBoolean;
        announcement_message: z.ZodNullable<z.ZodString>;
        announcement_level: z.ZodEnum<{
            info: "info";
            warning: "warning";
            critical: "critical";
        }>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type AnnouncementResponse = z.infer<typeof announcementResponseSchema>;
export declare const rateLimitBodySchema: z.ZodObject<{
    max: z.ZodNumber;
    window_ms: z.ZodNumber;
}, z.core.$strict>;
export type RateLimitBody = z.infer<typeof rateLimitBodySchema>;
export declare const rateLimitResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        rate_limit_auth_max: z.ZodNumber;
        rate_limit_auth_window_ms: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export type RateLimitResponse = z.infer<typeof rateLimitResponseSchema>;
export declare const OPS_FLAGS_PATH = "/api/ops/flags";
export declare const OPS_MAINTENANCE_PATH = "/api/ops/settings/maintenance";
export declare const OPS_ANNOUNCEMENT_PATH = "/api/ops/settings/announcement";
export declare const OPS_RATE_LIMIT_PATH = "/api/ops/settings/rate-limit";
/** The route path for one flag's toggle. */
export declare function flagTogglePath(key: string): string;
declare const emptyQuerySchema: z.ZodObject<{}, z.core.$strict>;
export declare const OpsFlagsOperation: OpsOperation<typeof emptyQuerySchema, typeof flagsResponseSchema>;
export declare const OpsFlagToggleOperation: OpsOperation<typeof flagToggleBodySchema, typeof flagToggleResponseSchema>;
export declare const OpsMaintenanceOperation: OpsOperation<typeof maintenanceBodySchema, typeof maintenanceResponseSchema>;
export declare const OpsAnnouncementOperation: OpsOperation<typeof announcementBodySchema, typeof announcementResponseSchema>;
export declare const OpsRateLimitOperation: OpsOperation<typeof rateLimitBodySchema, typeof rateLimitResponseSchema>;
