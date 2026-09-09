"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineQueuePauseOperation = exports.PipelineQueueDrainOperation = exports.PipelineRetryOperation = exports.PipelineHealthOperation = exports.SystemBackupRunOperation = exports.SystemSitemapOperation = exports.SystemCacheClearOperation = exports.pipelineQueuePauseResponseSchema = exports.pipelineQueuePauseRequestSchema = exports.pipelineQueueDrainResponseSchema = exports.pipelineRetryResponseSchema = exports.pipelineRetryRequestSchema = exports.pipelineHealthResponseSchema = exports.pipelineHealthSchema = exports.pipelineQueueHealthSchema = exports.systemBackupRunResponseSchema = exports.systemSitemapResponseSchema = exports.systemCacheClearResponseSchema = exports.systemCacheClearRequestSchema = exports.SystemBackupsOperation = exports.SystemMigrationsOperation = exports.SystemInfoOperation = exports.SystemHealthOperation = exports.systemBackupsResponseSchema = exports.opsBackupRecordSchema = exports.systemMigrationsResponseSchema = exports.systemMigrationsSchema = exports.systemMigrationRowSchema = exports.systemInfoResponseSchema = exports.systemInfoSchema = exports.systemHealthResponseSchema = exports.systemHealthSchema = exports.SYSTEM_PROBE_KEYS = exports.systemProbeSchema = void 0;
/**
 * Ledger row 5a (msn-0da39441) — the ops System console READ surfaces:
 * `GET /api/ops/system/health`, `/info`, `/migrations`, `/backups`
 * (C-OPSY-04/06/07/10, schooltest-api/src/api/ops/routes/09-custom-ops-system.ts).
 *
 * The schemas mirror what the server REALLY returns — verified against the live
 * stack byte-for-byte before they were written (health carries an OPTIONAL
 * `detail` that is absent on a passing probe with no summary, e.g. redis;
 * backups is a bare array that is empty on a fresh database). The mutation
 * half of the surface (backup/cache-clear/sitemap/pipeline) is ledger slices
 * 5c/5d and deliberately has no schema here yet.
 *
 * `overall` is a sixth probe beside the five real ones: the server's own roll-up
 * (down when any probe is down, latency the max). The console renders it as
 * honestly as the rest — including a down web probe, which is a real state on
 * this stack, never a value to smooth over.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
/** C-OPSY-06 health probe: the timed result of one dependency check. */
exports.systemProbeSchema = zod_1.z.object({
    status: zod_1.z.enum(['up', 'down']),
    latency_ms: zod_1.z.number().int().nonnegative(),
    detail: zod_1.z.string().optional(),
});
exports.SYSTEM_PROBE_KEYS = ['database', 'redis', 'queues', 'storage', 'web'];
/** `overall` is the server's roll-up probe, spelled exactly like the rest. */
exports.systemHealthSchema = zod_1.z.object({
    database: exports.systemProbeSchema,
    redis: exports.systemProbeSchema,
    queues: exports.systemProbeSchema,
    storage: exports.systemProbeSchema,
    web: exports.systemProbeSchema,
    overall: exports.systemProbeSchema,
});
exports.systemHealthResponseSchema = zod_1.z.object({ data: exports.systemHealthSchema });
/** C-OPSY-07: versions and uptime ONLY — never a secret, never a connection string. */
exports.systemInfoSchema = zod_1.z.object({
    strapi_version: zod_1.z.string(),
    node_version: zod_1.z.string(),
    uptime_s: zod_1.z.number().int().nonnegative(),
    env: zod_1.z.string(),
    database: zod_1.z.object({ client: zod_1.z.string() }),
    timezone: zod_1.z.string(),
    queues: zod_1.z.array(zod_1.z.string()),
});
exports.systemInfoResponseSchema = zod_1.z.object({ data: exports.systemInfoSchema });
/** One applied user migration, newest first as the server orders them. */
exports.systemMigrationRowSchema = zod_1.z.object({
    name: zod_1.z.string(),
    time: zod_1.z.string().nullable(),
});
exports.systemMigrationsSchema = zod_1.z.object({
    rows: zod_1.z.array(exports.systemMigrationRowSchema),
    count: zod_1.z.number().int().nonnegative(),
});
exports.systemMigrationsResponseSchema = zod_1.z.object({ data: exports.systemMigrationsSchema });
/** C-OPSY-04: one recorded backup ledger row (newest first as the server orders them). */
exports.opsBackupRecordSchema = zod_1.z.object({
    documentId: zod_1.z.string(),
    filename: zod_1.z.string(),
    // Postgres bigint: the LIST read serializes it as a string of digits, the
    // RUN response as a JSON number — both are the real wire, so both parse.
    bytes: zod_1.z.coerce.number().int().nonnegative(),
    status: zod_1.z.enum(['succeeded', 'failed']),
    started_at: zod_1.z.string(),
    finished_at: zod_1.z.string().nullable(),
    error: zod_1.z.string().nullish(),
    database: zod_1.z.string().optional(),
});
/** The list is a bare array of rows (server: `ctx.body = { data: backup().list(50) }`). */
exports.systemBackupsResponseSchema = zod_1.z.object({ data: zod_1.z.array(exports.opsBackupRecordSchema) });
const SYSTEM_READ_ERRORS = [400, 401, 403, 404, 429, 500];
exports.SystemHealthOperation = Object.freeze({
    contractId: 'C-OPSY-06',
    method: 'GET',
    path: '/api/ops/system/health',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.systemHealthResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_READ_ERRORS),
});
exports.SystemInfoOperation = Object.freeze({
    contractId: 'C-OPSY-07',
    method: 'GET',
    path: '/api/ops/system/info',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.systemInfoResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_READ_ERRORS),
});
exports.SystemMigrationsOperation = Object.freeze({
    contractId: 'C-OPSY-10',
    method: 'GET',
    path: '/api/ops/system/migrations',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.systemMigrationsResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_READ_ERRORS),
});
exports.SystemBackupsOperation = Object.freeze({
    contractId: 'C-OPSY-04',
    method: 'GET',
    path: '/api/ops/system/backups',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.systemBackupsResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_READ_ERRORS),
});
/* --- ledger row 5c: the read-plus-mutation actions ---------------------- */
/** C-OPSY-01 cache clear — `{ scope, keys_cleared }`; scope echoes the request. */
exports.systemCacheClearRequestSchema = zod_1.z.object({
    scope: zod_1.z.enum(['all', 'settings', 'search', 'legal']),
});
exports.systemCacheClearResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        scope: zod_1.z.string(),
        keys_cleared: zod_1.z.number().int().nonnegative(),
    }),
});
/** C-OPSY-02 sitemap regenerate — stamps the setting, revalidates the web app, counts URLs. */
exports.systemSitemapResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        regenerated_at: zod_1.z.string(),
        revalidated: zod_1.z.boolean(),
        urls: zod_1.z.number().int().nonnegative(),
    }),
});
/** C-OPSY-03 backup run — returns the recorded row (succeeded or, on failure, nothing: it throws). */
exports.systemBackupRunResponseSchema = zod_1.z.object({ data: exports.opsBackupRecordSchema });
/* --- ledger row 5d: the pipeline surface (C-OPS-03) ---------------------- */
exports.pipelineQueueHealthSchema = zod_1.z.object({
    name: zod_1.z.string(),
    waiting: zod_1.z.number().int().nonnegative(),
    active: zod_1.z.number().int().nonnegative(),
    failed: zod_1.z.number().int().nonnegative(),
    completed: zod_1.z.number().int().nonnegative(),
});
exports.pipelineHealthSchema = zod_1.z.object({
    queues: zod_1.z.array(exports.pipelineQueueHealthSchema),
    r_scoring: zod_1.z.enum(['up', 'down']),
});
exports.pipelineHealthResponseSchema = zod_1.z.object({ data: exports.pipelineHealthSchema });
/** Retry re-runs ONE failed job through BullMQ's own retry — never a rebuild. */
exports.pipelineRetryRequestSchema = zod_1.z.object({
    queue: zod_1.z.string().min(1),
    job_id: zod_1.z.string().min(1),
});
exports.pipelineRetryResponseSchema = zod_1.z.object({
    data: zod_1.z.object({ retried: zod_1.z.literal(true) }),
});
exports.pipelineQueueDrainResponseSchema = zod_1.z.object({
    data: zod_1.z.object({ queue: zod_1.z.string(), removed: zod_1.z.number().int().nonnegative() }),
});
exports.pipelineQueuePauseRequestSchema = zod_1.z.object({ paused: zod_1.z.boolean() });
exports.pipelineQueuePauseResponseSchema = zod_1.z.object({
    data: zod_1.z.object({ queue: zod_1.z.string(), paused: zod_1.z.boolean() }),
});
const SYSTEM_MUTATION_ERRORS = [400, 401, 403, 404, 429, 500, 502];
exports.SystemCacheClearOperation = Object.freeze({
    contractId: 'C-OPSY-01',
    method: 'POST',
    path: '/api/ops/system/cache/clear',
    request: exports.systemCacheClearRequestSchema,
    response: exports.systemCacheClearResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
exports.SystemSitemapOperation = Object.freeze({
    contractId: 'C-OPSY-02',
    method: 'POST',
    path: '/api/ops/system/sitemap/regenerate',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.systemSitemapResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
exports.SystemBackupRunOperation = Object.freeze({
    contractId: 'C-OPSY-03',
    method: 'POST',
    path: '/api/ops/system/backup',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.systemBackupRunResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
exports.PipelineHealthOperation = Object.freeze({
    contractId: 'C-OPS-03',
    method: 'GET',
    path: '/api/ops/pipeline/health',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.pipelineHealthResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_READ_ERRORS),
});
exports.PipelineRetryOperation = Object.freeze({
    contractId: 'C-OPS-03',
    method: 'POST',
    path: '/api/ops/pipeline/retry',
    request: exports.pipelineRetryRequestSchema,
    response: exports.pipelineRetryResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
exports.PipelineQueueDrainOperation = Object.freeze({
    contractId: 'C-OPSY-08',
    method: 'POST',
    path: '/api/ops/pipeline/queues/:name/drain',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.pipelineQueueDrainResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
exports.PipelineQueuePauseOperation = Object.freeze({
    contractId: 'C-OPSY-09',
    method: 'POST',
    path: '/api/ops/pipeline/queues/:name/pause',
    request: exports.pipelineQueuePauseRequestSchema,
    response: exports.pipelineQueuePauseResponseSchema,
    success: 200,
    errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
