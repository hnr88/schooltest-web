"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentReindexOperation = exports.MediaPruneOperation = exports.MediaStatsOperation = exports.OrphanPurgeOperation = exports.ContentOrphansOperation = exports.ContentCountsOperation = exports.contentReindexResponseSchema = exports.mediaPruneResponseSchema = exports.maintenanceActionRequestSchema = exports.mediaStatsResponseSchema = exports.mediaStatsSchema = exports.mediaMimeStatsSchema = exports.orphanPurgeResponseSchema = exports.orphanPurgeRequestSchema = exports.contentOrphansResponseSchema = exports.orphanKindReportSchema = exports.orphanKindSchema = exports.ORPHAN_KINDS = exports.contentCountsResponseSchema = exports.contentCountRowSchema = void 0;
/**
 * Ledger row 8 (msn-0da39441) — the ops Content console surfaces:
 * `GET /api/ops/content/counts`, `GET /api/ops/content/orphans`,
 * `POST /api/ops/content/orphans/purge`, `POST /api/ops/content/reindex-search`,
 * `GET /api/ops/media/stats`, `POST /api/ops/media/prune`
 * (C-OPSC-01..06, schooltest-api/src/api/ops/routes/08-custom-ops-content.ts).
 *
 * Shapes mirror the live wire byte-for-byte (verified before writing): counts
 * rows are the api:: content-type enumeration; orphans are per-kind reports
 * with a 20-documentId sample; the three maintenance actions ALL honour the
 * `dryRun`-defaults-to-true rule and echo the flag they executed, so the UI
 * can show honestly whether it reported or destroyed.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
/* --- C-OPSC-01: row counts for every api:: content type ----------------- */
exports.contentCountRowSchema = zod_1.z.object({
    uid: zod_1.z.string(),
    singularName: zod_1.z.string(),
    displayName: zod_1.z.string(),
    count: zod_1.z.number().int().nonnegative(),
});
exports.contentCountsResponseSchema = zod_1.z.object({ data: zod_1.z.array(exports.contentCountRowSchema) });
/* --- C-OPSC-02: orphan reports ------------------------------------------ */
exports.ORPHAN_KINDS = [
    'students_without_school',
    'sessions_without_student',
    'results_without_session',
    'results_without_student',
    'invitations_without_school',
];
exports.orphanKindSchema = zod_1.z.enum(exports.ORPHAN_KINDS);
exports.orphanKindReportSchema = zod_1.z.object({
    kind: exports.orphanKindSchema,
    count: zod_1.z.number().int().nonnegative(),
    sample: zod_1.z.array(zod_1.z.string()),
});
exports.contentOrphansResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.orphanKindReportSchema),
});
/* --- C-OPSC-03: purge (dryRun defaults true server-side) ----------------- */
exports.orphanPurgeRequestSchema = zod_1.z.object({
    kinds: zod_1.z.array(exports.orphanKindSchema).min(1),
    dryRun: zod_1.z.boolean().optional(),
});
exports.orphanPurgeResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        purged: zod_1.z.record(exports.orphanKindSchema, zod_1.z.number().int().nonnegative()),
        dryRun: zod_1.z.boolean(),
    }),
});
/* --- C-OPSC-04: media stats ---------------------------------------------- */
exports.mediaMimeStatsSchema = zod_1.z.object({
    mime: zod_1.z.string(),
    count: zod_1.z.number().int().nonnegative(),
    bytes: zod_1.z.number().int().nonnegative(),
});
exports.mediaStatsSchema = zod_1.z.object({
    files: zod_1.z.number().int().nonnegative(),
    total_bytes: zod_1.z.number().int().nonnegative(),
    by_mime: zod_1.z.array(exports.mediaMimeStatsSchema),
    unreferenced_count: zod_1.z.number().int().nonnegative(),
});
exports.mediaStatsResponseSchema = zod_1.z.object({ data: exports.mediaStatsSchema });
/* --- C-OPSC-05/06: prune + reindex (both dryRun-default, DRIFT-6) -------- */
exports.maintenanceActionRequestSchema = zod_1.z.object({
    dryRun: zod_1.z.boolean().optional(),
});
exports.mediaPruneResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        removed: zod_1.z.number().int().nonnegative(),
        bytes_freed: zod_1.z.number().int().nonnegative(),
        dryRun: zod_1.z.boolean(),
    }),
});
exports.contentReindexResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        indexed: zod_1.z.number().int().nonnegative(),
        took_ms: zod_1.z.number().int().nonnegative(),
        missing_slug: zod_1.z.number().int().nonnegative(),
        dryRun: zod_1.z.boolean(),
    }),
});
const CONTENT_ERRORS = [400, 401, 403, 404, 429, 500];
exports.ContentCountsOperation = Object.freeze({
    contractId: 'C-OPSC-01',
    method: 'GET',
    path: '/api/ops/content/counts',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.contentCountsResponseSchema,
    success: 200,
    errors: Object.freeze(CONTENT_ERRORS),
});
exports.ContentOrphansOperation = Object.freeze({
    contractId: 'C-OPSC-02',
    method: 'GET',
    path: '/api/ops/content/orphans',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.contentOrphansResponseSchema,
    success: 200,
    errors: Object.freeze(CONTENT_ERRORS),
});
exports.OrphanPurgeOperation = Object.freeze({
    contractId: 'C-OPSC-03',
    method: 'POST',
    path: '/api/ops/content/orphans/purge',
    request: exports.orphanPurgeRequestSchema,
    response: exports.orphanPurgeResponseSchema,
    success: 200,
    errors: Object.freeze(CONTENT_ERRORS),
});
exports.MediaStatsOperation = Object.freeze({
    contractId: 'C-OPSC-04',
    method: 'GET',
    path: '/api/ops/media/stats',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.mediaStatsResponseSchema,
    success: 200,
    errors: Object.freeze(CONTENT_ERRORS),
});
exports.MediaPruneOperation = Object.freeze({
    contractId: 'C-OPSC-05',
    method: 'POST',
    path: '/api/ops/media/prune',
    request: exports.maintenanceActionRequestSchema,
    response: exports.mediaPruneResponseSchema,
    success: 200,
    errors: Object.freeze(CONTENT_ERRORS),
});
exports.ContentReindexOperation = Object.freeze({
    contractId: 'C-OPSC-06',
    method: 'POST',
    path: '/api/ops/content/reindex-search',
    request: exports.maintenanceActionRequestSchema,
    response: exports.contentReindexResponseSchema,
    success: 200,
    errors: Object.freeze(CONTENT_ERRORS),
});
