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
import { z } from 'zod';

import { dataEnvelope } from './core';

/* --- C-OPSC-01: row counts for every api:: content type ----------------- */

export const contentCountRowSchema = z.object({
  uid: z.string(),
  singularName: z.string(),
  displayName: z.string(),
  count: z.number().int().nonnegative(),
});
export type ContentCountRow = z.infer<typeof contentCountRowSchema>;

export const contentCountsResponseSchema = z.object({ data: z.array(contentCountRowSchema) });
export type ContentCountsResponse = z.infer<typeof contentCountsResponseSchema>;

/* --- C-OPSC-02: orphan reports ------------------------------------------ */

export const ORPHAN_KINDS = [
  'students_without_school',
  'sessions_without_student',
  'results_without_session',
  'results_without_student',
  'invitations_without_school',
] as const;

export const orphanKindSchema = z.enum(ORPHAN_KINDS);
export type OrphanKind = z.infer<typeof orphanKindSchema>;

export const orphanKindReportSchema = z.object({
  kind: orphanKindSchema,
  count: z.number().int().nonnegative(),
  sample: z.array(z.string()),
});
export type OrphanKindReport = z.infer<typeof orphanKindReportSchema>;

export const contentOrphansResponseSchema = z.object({
  data: z.array(orphanKindReportSchema),
});
export type ContentOrphansResponse = z.infer<typeof contentOrphansResponseSchema>;

/* --- C-OPSC-03: purge (dryRun defaults true server-side) ----------------- */

export const orphanPurgeRequestSchema = z.object({
  kinds: z.array(orphanKindSchema).min(1),
  dryRun: z.boolean().optional(),
});
export type OrphanPurgeRequest = z.infer<typeof orphanPurgeRequestSchema>;

export const orphanPurgeResponseSchema = z.object({
  data: z.object({
    purged: z.record(orphanKindSchema, z.number().int().nonnegative()),
    dryRun: z.boolean(),
  }),
});
export type OrphanPurgeResponse = z.infer<typeof orphanPurgeResponseSchema>;

/* --- C-OPSC-04: media stats ---------------------------------------------- */

export const mediaMimeStatsSchema = z.object({
  mime: z.string(),
  count: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
});
export type MediaMimeStats = z.infer<typeof mediaMimeStatsSchema>;

export const mediaStatsSchema = z.object({
  files: z.number().int().nonnegative(),
  total_bytes: z.number().int().nonnegative(),
  by_mime: z.array(mediaMimeStatsSchema),
  unreferenced_count: z.number().int().nonnegative(),
});
export type MediaStats = z.infer<typeof mediaStatsSchema>;

export const mediaStatsResponseSchema = z.object({ data: mediaStatsSchema });
export type MediaStatsResponse = z.infer<typeof mediaStatsResponseSchema>;

/* --- C-OPSC-05/06: prune + reindex (both dryRun-default, DRIFT-6) -------- */

export const maintenanceActionRequestSchema = z.object({
  dryRun: z.boolean().optional(),
});
export type MaintenanceActionRequest = z.infer<typeof maintenanceActionRequestSchema>;

export const mediaPruneResponseSchema = z.object({
  data: z.object({
    removed: z.number().int().nonnegative(),
    bytes_freed: z.number().int().nonnegative(),
    dryRun: z.boolean(),
  }),
});
export type MediaPruneResponse = z.infer<typeof mediaPruneResponseSchema>;

export const contentReindexResponseSchema = z.object({
  data: z.object({
    indexed: z.number().int().nonnegative(),
    took_ms: z.number().int().nonnegative(),
    missing_slug: z.number().int().nonnegative(),
    dryRun: z.boolean(),
  }),
});
export type ContentReindexResponse = z.infer<typeof contentReindexResponseSchema>;

const CONTENT_ERRORS = [400, 401, 403, 404, 429, 500] as const;

export const ContentCountsOperation = Object.freeze({
  contractId: 'C-OPSC-01',
  method: 'GET',
  path: '/api/ops/content/counts',
  request: dataEnvelope(z.object({})),
  response: contentCountsResponseSchema,
  success: 200,
  errors: Object.freeze(CONTENT_ERRORS),
});

export const ContentOrphansOperation = Object.freeze({
  contractId: 'C-OPSC-02',
  method: 'GET',
  path: '/api/ops/content/orphans',
  request: dataEnvelope(z.object({})),
  response: contentOrphansResponseSchema,
  success: 200,
  errors: Object.freeze(CONTENT_ERRORS),
});

export const OrphanPurgeOperation = Object.freeze({
  contractId: 'C-OPSC-03',
  method: 'POST',
  path: '/api/ops/content/orphans/purge',
  request: orphanPurgeRequestSchema,
  response: orphanPurgeResponseSchema,
  success: 200,
  errors: Object.freeze(CONTENT_ERRORS),
});

export const MediaStatsOperation = Object.freeze({
  contractId: 'C-OPSC-04',
  method: 'GET',
  path: '/api/ops/media/stats',
  request: dataEnvelope(z.object({})),
  response: mediaStatsResponseSchema,
  success: 200,
  errors: Object.freeze(CONTENT_ERRORS),
});

export const MediaPruneOperation = Object.freeze({
  contractId: 'C-OPSC-05',
  method: 'POST',
  path: '/api/ops/media/prune',
  request: maintenanceActionRequestSchema,
  response: mediaPruneResponseSchema,
  success: 200,
  errors: Object.freeze(CONTENT_ERRORS),
});

export const ContentReindexOperation = Object.freeze({
  contractId: 'C-OPSC-06',
  method: 'POST',
  path: '/api/ops/content/reindex-search',
  request: maintenanceActionRequestSchema,
  response: contentReindexResponseSchema,
  success: 200,
  errors: Object.freeze(CONTENT_ERRORS),
});
