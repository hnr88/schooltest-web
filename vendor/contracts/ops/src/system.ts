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
import { z } from 'zod';

import { dataEnvelope } from './core';

/** C-OPSY-06 health probe: the timed result of one dependency check. */
export const systemProbeSchema = z.object({
  status: z.enum(['up', 'down']),
  latency_ms: z.number().int().nonnegative(),
  detail: z.string().optional(),
});
export type SystemProbe = z.infer<typeof systemProbeSchema>;

export const SYSTEM_PROBE_KEYS = ['database', 'redis', 'queues', 'storage', 'web'] as const;
export type SystemProbeKey = (typeof SYSTEM_PROBE_KEYS)[number];

/** `overall` is the server's roll-up probe, spelled exactly like the rest. */
export const systemHealthSchema = z.object({
  database: systemProbeSchema,
  redis: systemProbeSchema,
  queues: systemProbeSchema,
  storage: systemProbeSchema,
  web: systemProbeSchema,
  overall: systemProbeSchema,
});
export type SystemHealth = z.infer<typeof systemHealthSchema>;

export const systemHealthResponseSchema = z.object({ data: systemHealthSchema });
export type SystemHealthResponse = z.infer<typeof systemHealthResponseSchema>;

/** C-OPSY-07: versions and uptime ONLY — never a secret, never a connection string. */
export const systemInfoSchema = z.object({
  strapi_version: z.string(),
  node_version: z.string(),
  uptime_s: z.number().int().nonnegative(),
  env: z.string(),
  database: z.object({ client: z.string() }),
  timezone: z.string(),
  queues: z.array(z.string()),
});
export type SystemInfo = z.infer<typeof systemInfoSchema>;

export const systemInfoResponseSchema = z.object({ data: systemInfoSchema });
export type SystemInfoResponse = z.infer<typeof systemInfoResponseSchema>;

/** One applied user migration, newest first as the server orders them. */
export const systemMigrationRowSchema = z.object({
  name: z.string(),
  time: z.string().nullable(),
});
export type SystemMigrationRow = z.infer<typeof systemMigrationRowSchema>;

export const systemMigrationsSchema = z.object({
  rows: z.array(systemMigrationRowSchema),
  count: z.number().int().nonnegative(),
});
export type SystemMigrations = z.infer<typeof systemMigrationsSchema>;

export const systemMigrationsResponseSchema = z.object({ data: systemMigrationsSchema });
export type SystemMigrationsResponse = z.infer<typeof systemMigrationsResponseSchema>;

/** C-OPSY-04: one recorded backup ledger row (newest first as the server orders them). */
export const opsBackupRecordSchema = z.object({
  documentId: z.string(),
  filename: z.string(),
  // Postgres bigint: the LIST read serializes it as a string of digits, the
  // RUN response as a JSON number — both are the real wire, so both parse.
  bytes: z.coerce.number().int().nonnegative(),
  status: z.enum(['succeeded', 'failed']),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  error: z.string().nullish(),
  database: z.string().optional(),
});
export type OpsBackupRecord = z.infer<typeof opsBackupRecordSchema>;

/** The list is a bare array of rows (server: `ctx.body = { data: backup().list(50) }`). */
export const systemBackupsResponseSchema = z.object({ data: z.array(opsBackupRecordSchema) });
export type SystemBackupsResponse = z.infer<typeof systemBackupsResponseSchema>;

const SYSTEM_READ_ERRORS = [400, 401, 403, 404, 429, 500] as const;

export const SystemHealthOperation = Object.freeze({
  contractId: 'C-OPSY-06',
  method: 'GET',
  path: '/api/ops/system/health',
  request: dataEnvelope(z.object({})),
  response: systemHealthResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_READ_ERRORS),
});

export const SystemInfoOperation = Object.freeze({
  contractId: 'C-OPSY-07',
  method: 'GET',
  path: '/api/ops/system/info',
  request: dataEnvelope(z.object({})),
  response: systemInfoResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_READ_ERRORS),
});

export const SystemMigrationsOperation = Object.freeze({
  contractId: 'C-OPSY-10',
  method: 'GET',
  path: '/api/ops/system/migrations',
  request: dataEnvelope(z.object({})),
  response: systemMigrationsResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_READ_ERRORS),
});

export const SystemBackupsOperation = Object.freeze({
  contractId: 'C-OPSY-04',
  method: 'GET',
  path: '/api/ops/system/backups',
  request: dataEnvelope(z.object({})),
  response: systemBackupsResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_READ_ERRORS),
});

/* --- ledger row 5c: the read-plus-mutation actions ---------------------- */

/** C-OPSY-01 cache clear — `{ scope, keys_cleared }`; scope echoes the request. */
export const systemCacheClearRequestSchema = z.object({
  scope: z.enum(['all', 'settings', 'search', 'legal']),
});
export type SystemCacheClearRequest = z.infer<typeof systemCacheClearRequestSchema>;

export const systemCacheClearResponseSchema = z.object({
  data: z.object({
    scope: z.string(),
    keys_cleared: z.number().int().nonnegative(),
  }),
});
export type SystemCacheClearResponse = z.infer<typeof systemCacheClearResponseSchema>;

/** C-OPSY-02 sitemap regenerate — stamps the setting, revalidates the web app, counts URLs. */
export const systemSitemapResponseSchema = z.object({
  data: z.object({
    regenerated_at: z.string(),
    revalidated: z.boolean(),
    urls: z.number().int().nonnegative(),
  }),
});
export type SystemSitemapResponse = z.infer<typeof systemSitemapResponseSchema>;

/** C-OPSY-03 backup run — returns the recorded row (succeeded or, on failure, nothing: it throws). */
export const systemBackupRunResponseSchema = z.object({ data: opsBackupRecordSchema });
export type SystemBackupRunResponse = z.infer<typeof systemBackupRunResponseSchema>;

/* --- ledger row 5d: the pipeline surface (C-OPS-03) ---------------------- */

export const pipelineQueueHealthSchema = z.object({
  name: z.string(),
  waiting: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
});
export type PipelineQueueHealth = z.infer<typeof pipelineQueueHealthSchema>;

export const pipelineHealthSchema = z.object({
  queues: z.array(pipelineQueueHealthSchema),
  r_scoring: z.enum(['up', 'down']),
});
export type PipelineHealth = z.infer<typeof pipelineHealthSchema>;

export const pipelineHealthResponseSchema = z.object({ data: pipelineHealthSchema });
export type PipelineHealthResponse = z.infer<typeof pipelineHealthResponseSchema>;

/** Retry re-runs ONE failed job through BullMQ's own retry — never a rebuild. */
export const pipelineRetryRequestSchema = z.object({
  queue: z.string().min(1),
  job_id: z.string().min(1),
});
export type PipelineRetryRequest = z.infer<typeof pipelineRetryRequestSchema>;

export const pipelineRetryResponseSchema = z.object({
  data: z.object({ retried: z.literal(true) }),
});
export type PipelineRetryResponse = z.infer<typeof pipelineRetryResponseSchema>;

export const pipelineQueueDrainResponseSchema = z.object({
  data: z.object({ queue: z.string(), removed: z.number().int().nonnegative() }),
});
export type PipelineQueueDrainResponse = z.infer<typeof pipelineQueueDrainResponseSchema>;

export const pipelineQueuePauseRequestSchema = z.object({ paused: z.boolean() });
export type PipelineQueuePauseRequest = z.infer<typeof pipelineQueuePauseRequestSchema>;

export const pipelineQueuePauseResponseSchema = z.object({
  data: z.object({ queue: z.string(), paused: z.boolean() }),
});
export type PipelineQueuePauseResponse = z.infer<typeof pipelineQueuePauseResponseSchema>;

const SYSTEM_MUTATION_ERRORS = [400, 401, 403, 404, 429, 500, 502] as const;

export const SystemCacheClearOperation = Object.freeze({
  contractId: 'C-OPSY-01',
  method: 'POST',
  path: '/api/ops/system/cache/clear',
  request: systemCacheClearRequestSchema,
  response: systemCacheClearResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});

export const SystemSitemapOperation = Object.freeze({
  contractId: 'C-OPSY-02',
  method: 'POST',
  path: '/api/ops/system/sitemap/regenerate',
  request: dataEnvelope(z.object({})),
  response: systemSitemapResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});

export const SystemBackupRunOperation = Object.freeze({
  contractId: 'C-OPSY-03',
  method: 'POST',
  path: '/api/ops/system/backup',
  request: dataEnvelope(z.object({})),
  response: systemBackupRunResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});

export const PipelineHealthOperation = Object.freeze({
  contractId: 'C-OPS-03',
  method: 'GET',
  path: '/api/ops/pipeline/health',
  request: dataEnvelope(z.object({})),
  response: pipelineHealthResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_READ_ERRORS),
});

export const PipelineRetryOperation = Object.freeze({
  contractId: 'C-OPS-03',
  method: 'POST',
  path: '/api/ops/pipeline/retry',
  request: pipelineRetryRequestSchema,
  response: pipelineRetryResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});

export const PipelineQueueDrainOperation = Object.freeze({
  contractId: 'C-OPSY-08',
  method: 'POST',
  path: '/api/ops/pipeline/queues/:name/drain',
  request: dataEnvelope(z.object({})),
  response: pipelineQueueDrainResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});

export const PipelineQueuePauseOperation = Object.freeze({
  contractId: 'C-OPSY-09',
  method: 'POST',
  path: '/api/ops/pipeline/queues/:name/pause',
  request: pipelineQueuePauseRequestSchema,
  response: pipelineQueuePauseResponseSchema,
  success: 200,
  errors: Object.freeze(SYSTEM_MUTATION_ERRORS),
});
