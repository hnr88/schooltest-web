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
// REUSED, not redeclared. `./settings-read` already defines this enum for the
// full settings row and its definition is value-identical; declaring a second
// one collided at the barrel (TS2308) — which is the index's own integrator
// warning about parallel domain enums, caught here rather than papered over.
import { announcementLevelSchema, type AnnouncementLevel } from './settings-read';

const FLAG_KEY_MAX = 100;
const FLAG_DESCRIPTION_MAX = 500;
const MESSAGE_MAX = 2000;

/** The controller's own ceilings for the rate-limit pair, mirrored exactly. */
export const RATE_LIMIT_MAX_MIN = 1;
export const RATE_LIMIT_MAX_MAX = 1000;
export const RATE_LIMIT_WINDOW_MIN_MS = 1000;
export const RATE_LIMIT_WINDOW_MAX_MS = 3_600_000;

/**
 * The announcement levels the controller admits (anything else is a 400 naming
 * these three), derived from the reused schema so there is ONE source of truth
 * rather than an array that can drift from the enum beside it.
 */
export const ANNOUNCEMENT_LEVELS = announcementLevelSchema.options;
export type { AnnouncementLevel };

/**
 * The app's real feature flags, as the server's closed registry defines them.
 * Listed here so a client can reason about a key it has not fetched yet; the
 * SERVER list is still the authority and the console renders what it returns.
 */
export const KNOWN_FLAG_KEYS = [
  'parent_views_enabled',
  'maintenance_banner',
  'ops_destructive_actions',
] as const;
export type KnownFlagKey = (typeof KNOWN_FLAG_KEYS)[number];

/**
 * One registry row. `key` is deliberately a plain bounded string rather than
 * the enum above: the server owns the registry, and a newly shipped flag must
 * RENDER rather than fail the contract on a console that has not been rebuilt.
 */
export const flagRowSchema = z.strictObject({
  key: z.string().min(1).max(FLAG_KEY_MAX),
  description: z.string().min(1).max(FLAG_DESCRIPTION_MAX),
  enabled: z.boolean(),
});
export type FlagRow = z.infer<typeof flagRowSchema>;

export const flagsResponseSchema = z.strictObject({ data: z.array(flagRowSchema) });
export type FlagsResponse = z.infer<typeof flagsResponseSchema>;

/** The toggle takes a REQUIRED boolean — there is no "flip it" verb. */
export const flagToggleBodySchema = z.strictObject({ enabled: z.boolean() });
export type FlagToggleBody = z.infer<typeof flagToggleBodySchema>;

/** The ack echoes the key and its new value, not the whole registry. */
export const flagToggleResponseSchema = z.strictObject({
  data: z.strictObject({
    key: z.string().min(1).max(FLAG_KEY_MAX),
    enabled: z.boolean(),
  }),
});
export type FlagToggleResponse = z.infer<typeof flagToggleResponseSchema>;

export const maintenanceBodySchema = z.strictObject({
  enabled: z.boolean(),
  message: z.string().max(MESSAGE_MAX).nullable().optional(),
});
export type MaintenanceBody = z.infer<typeof maintenanceBodySchema>;

export const maintenanceResponseSchema = z.strictObject({
  data: z.strictObject({
    maintenance_mode: z.boolean(),
    maintenance_message: z.string().max(MESSAGE_MAX).nullable(),
  }),
});
export type MaintenanceResponse = z.infer<typeof maintenanceResponseSchema>;

export const announcementBodySchema = z.strictObject({
  enabled: z.boolean(),
  message: z.string().max(MESSAGE_MAX).nullable().optional(),
  level: announcementLevelSchema.optional(),
});
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
export const announcementResponseSchema = z.strictObject({
  data: z.strictObject({
    announcement_enabled: z.boolean(),
    announcement_message: z.string().max(MESSAGE_MAX).nullable(),
    announcement_level: announcementLevelSchema,
  }),
});
export type AnnouncementResponse = z.infer<typeof announcementResponseSchema>;

export const rateLimitBodySchema = z.strictObject({
  max: z.number().int().min(RATE_LIMIT_MAX_MIN).max(RATE_LIMIT_MAX_MAX),
  window_ms: z.number().int().min(RATE_LIMIT_WINDOW_MIN_MS).max(RATE_LIMIT_WINDOW_MAX_MS),
});
export type RateLimitBody = z.infer<typeof rateLimitBodySchema>;

export const rateLimitResponseSchema = z.strictObject({
  data: z.strictObject({
    rate_limit_auth_max: z.number().int().min(RATE_LIMIT_MAX_MIN).max(RATE_LIMIT_MAX_MAX),
    rate_limit_auth_window_ms: z
      .number()
      .int()
      .min(RATE_LIMIT_WINDOW_MIN_MS)
      .max(RATE_LIMIT_WINDOW_MAX_MS),
  }),
});
export type RateLimitResponse = z.infer<typeof rateLimitResponseSchema>;

export const OPS_FLAGS_PATH = '/api/ops/flags';
export const OPS_MAINTENANCE_PATH = '/api/ops/settings/maintenance';
export const OPS_ANNOUNCEMENT_PATH = '/api/ops/settings/announcement';
export const OPS_RATE_LIMIT_PATH = '/api/ops/settings/rate-limit';

/** The route path for one flag's toggle. */
export function flagTogglePath(key: string): string {
  return `${OPS_FLAGS_PATH}/${encodeURIComponent(key)}`;
}

const emptyQuerySchema = z.strictObject({});

export const OpsFlagsOperation: OpsOperation<
  typeof emptyQuerySchema,
  typeof flagsResponseSchema
> = Object.freeze({
  contractId: 'C-OPSF-01',
  method: 'GET',
  path: OPS_FLAGS_PATH,
  request: emptyQuerySchema,
  response: flagsResponseSchema,
  success: 200,
  errors: [401, 403, 429, 500],
});

export const OpsFlagToggleOperation: OpsOperation<
  typeof flagToggleBodySchema,
  typeof flagToggleResponseSchema
> = Object.freeze({
  contractId: 'C-OPSF-02',
  method: 'PUT',
  path: `${OPS_FLAGS_PATH}/:key`,
  request: flagToggleBodySchema,
  response: flagToggleResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});

export const OpsMaintenanceOperation: OpsOperation<
  typeof maintenanceBodySchema,
  typeof maintenanceResponseSchema
> = Object.freeze({
  contractId: 'C-OPSF-03',
  method: 'PUT',
  path: OPS_MAINTENANCE_PATH,
  request: maintenanceBodySchema,
  response: maintenanceResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});

export const OpsAnnouncementOperation: OpsOperation<
  typeof announcementBodySchema,
  typeof announcementResponseSchema
> = Object.freeze({
  contractId: 'C-OPSF-04',
  method: 'PUT',
  path: OPS_ANNOUNCEMENT_PATH,
  request: announcementBodySchema,
  response: announcementResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});

export const OpsRateLimitOperation: OpsOperation<
  typeof rateLimitBodySchema,
  typeof rateLimitResponseSchema
> = Object.freeze({
  contractId: 'C-OPSF-05',
  method: 'PUT',
  path: OPS_RATE_LIMIT_PATH,
  request: rateLimitBodySchema,
  response: rateLimitResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});
