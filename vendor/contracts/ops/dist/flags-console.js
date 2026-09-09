"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpsRateLimitOperation = exports.OpsAnnouncementOperation = exports.OpsMaintenanceOperation = exports.OpsFlagToggleOperation = exports.OpsFlagsOperation = exports.OPS_RATE_LIMIT_PATH = exports.OPS_ANNOUNCEMENT_PATH = exports.OPS_MAINTENANCE_PATH = exports.OPS_FLAGS_PATH = exports.rateLimitResponseSchema = exports.rateLimitBodySchema = exports.announcementResponseSchema = exports.announcementBodySchema = exports.maintenanceResponseSchema = exports.maintenanceBodySchema = exports.flagToggleResponseSchema = exports.flagToggleBodySchema = exports.flagsResponseSchema = exports.flagRowSchema = exports.KNOWN_FLAG_KEYS = exports.ANNOUNCEMENT_LEVELS = exports.RATE_LIMIT_WINDOW_MAX_MS = exports.RATE_LIMIT_WINDOW_MIN_MS = exports.RATE_LIMIT_MAX_MAX = exports.RATE_LIMIT_MAX_MIN = void 0;
exports.flagTogglePath = flagTogglePath;
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
const zod_1 = require("zod");
// REUSED, not redeclared. `./settings-read` already defines this enum for the
// full settings row and its definition is value-identical; declaring a second
// one collided at the barrel (TS2308) — which is the index's own integrator
// warning about parallel domain enums, caught here rather than papered over.
const settings_read_1 = require("./settings-read");
const FLAG_KEY_MAX = 100;
const FLAG_DESCRIPTION_MAX = 500;
const MESSAGE_MAX = 2000;
/** The controller's own ceilings for the rate-limit pair, mirrored exactly. */
exports.RATE_LIMIT_MAX_MIN = 1;
exports.RATE_LIMIT_MAX_MAX = 1000;
exports.RATE_LIMIT_WINDOW_MIN_MS = 1000;
exports.RATE_LIMIT_WINDOW_MAX_MS = 3600000;
/**
 * The announcement levels the controller admits (anything else is a 400 naming
 * these three), derived from the reused schema so there is ONE source of truth
 * rather than an array that can drift from the enum beside it.
 */
exports.ANNOUNCEMENT_LEVELS = settings_read_1.announcementLevelSchema.options;
/**
 * The app's real feature flags, as the server's closed registry defines them.
 * Listed here so a client can reason about a key it has not fetched yet; the
 * SERVER list is still the authority and the console renders what it returns.
 */
exports.KNOWN_FLAG_KEYS = [
    'parent_views_enabled',
    'maintenance_banner',
    'ops_destructive_actions',
];
/**
 * One registry row. `key` is deliberately a plain bounded string rather than
 * the enum above: the server owns the registry, and a newly shipped flag must
 * RENDER rather than fail the contract on a console that has not been rebuilt.
 */
exports.flagRowSchema = zod_1.z.strictObject({
    key: zod_1.z.string().min(1).max(FLAG_KEY_MAX),
    description: zod_1.z.string().min(1).max(FLAG_DESCRIPTION_MAX),
    enabled: zod_1.z.boolean(),
});
exports.flagsResponseSchema = zod_1.z.strictObject({ data: zod_1.z.array(exports.flagRowSchema) });
/** The toggle takes a REQUIRED boolean — there is no "flip it" verb. */
exports.flagToggleBodySchema = zod_1.z.strictObject({ enabled: zod_1.z.boolean() });
/** The ack echoes the key and its new value, not the whole registry. */
exports.flagToggleResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({
        key: zod_1.z.string().min(1).max(FLAG_KEY_MAX),
        enabled: zod_1.z.boolean(),
    }),
});
exports.maintenanceBodySchema = zod_1.z.strictObject({
    enabled: zod_1.z.boolean(),
    message: zod_1.z.string().max(MESSAGE_MAX).nullable().optional(),
});
exports.maintenanceResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({
        maintenance_mode: zod_1.z.boolean(),
        maintenance_message: zod_1.z.string().max(MESSAGE_MAX).nullable(),
    }),
});
exports.announcementBodySchema = zod_1.z.strictObject({
    enabled: zod_1.z.boolean(),
    message: zod_1.z.string().max(MESSAGE_MAX).nullable().optional(),
    level: settings_read_1.announcementLevelSchema.optional(),
});
/**
 * `announcement_level` is NON-nullable here, matching `./settings-read`'s
 * `settingsReadSchema` rather than the column's bare nullability: that sibling
 * schema already parses this field off the live settings route in production,
 * so the empirical answer is that the default keeps it populated. Two contracts
 * disagreeing about one field is worse than either choice, so this follows the
 * one with live evidence behind it. The messages stay nullable because clearing
 * one is a real, supported write.
 */
exports.announcementResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({
        announcement_enabled: zod_1.z.boolean(),
        announcement_message: zod_1.z.string().max(MESSAGE_MAX).nullable(),
        announcement_level: settings_read_1.announcementLevelSchema,
    }),
});
exports.rateLimitBodySchema = zod_1.z.strictObject({
    max: zod_1.z.number().int().min(exports.RATE_LIMIT_MAX_MIN).max(exports.RATE_LIMIT_MAX_MAX),
    window_ms: zod_1.z.number().int().min(exports.RATE_LIMIT_WINDOW_MIN_MS).max(exports.RATE_LIMIT_WINDOW_MAX_MS),
});
exports.rateLimitResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({
        rate_limit_auth_max: zod_1.z.number().int().min(exports.RATE_LIMIT_MAX_MIN).max(exports.RATE_LIMIT_MAX_MAX),
        rate_limit_auth_window_ms: zod_1.z
            .number()
            .int()
            .min(exports.RATE_LIMIT_WINDOW_MIN_MS)
            .max(exports.RATE_LIMIT_WINDOW_MAX_MS),
    }),
});
exports.OPS_FLAGS_PATH = '/api/ops/flags';
exports.OPS_MAINTENANCE_PATH = '/api/ops/settings/maintenance';
exports.OPS_ANNOUNCEMENT_PATH = '/api/ops/settings/announcement';
exports.OPS_RATE_LIMIT_PATH = '/api/ops/settings/rate-limit';
/** The route path for one flag's toggle. */
function flagTogglePath(key) {
    return `${exports.OPS_FLAGS_PATH}/${encodeURIComponent(key)}`;
}
const emptyQuerySchema = zod_1.z.strictObject({});
exports.OpsFlagsOperation = Object.freeze({
    contractId: 'C-OPSF-01',
    method: 'GET',
    path: exports.OPS_FLAGS_PATH,
    request: emptyQuerySchema,
    response: exports.flagsResponseSchema,
    success: 200,
    errors: [401, 403, 429, 500],
});
exports.OpsFlagToggleOperation = Object.freeze({
    contractId: 'C-OPSF-02',
    method: 'PUT',
    path: `${exports.OPS_FLAGS_PATH}/:key`,
    request: exports.flagToggleBodySchema,
    response: exports.flagToggleResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
exports.OpsMaintenanceOperation = Object.freeze({
    contractId: 'C-OPSF-03',
    method: 'PUT',
    path: exports.OPS_MAINTENANCE_PATH,
    request: exports.maintenanceBodySchema,
    response: exports.maintenanceResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
exports.OpsAnnouncementOperation = Object.freeze({
    contractId: 'C-OPSF-04',
    method: 'PUT',
    path: exports.OPS_ANNOUNCEMENT_PATH,
    request: exports.announcementBodySchema,
    response: exports.announcementResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
exports.OpsRateLimitOperation = Object.freeze({
    contractId: 'C-OPSF-05',
    method: 'PUT',
    path: exports.OPS_RATE_LIMIT_PATH,
    request: exports.rateLimitBodySchema,
    response: exports.rateLimitResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
