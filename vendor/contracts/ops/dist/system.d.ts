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
/** C-OPSY-06 health probe: the timed result of one dependency check. */
export declare const systemProbeSchema: z.ZodObject<{
    status: z.ZodEnum<{
        up: "up";
        down: "down";
    }>;
    latency_ms: z.ZodNumber;
    detail: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SystemProbe = z.infer<typeof systemProbeSchema>;
export declare const SYSTEM_PROBE_KEYS: readonly ["database", "redis", "queues", "storage", "web"];
export type SystemProbeKey = (typeof SYSTEM_PROBE_KEYS)[number];
/** `overall` is the server's roll-up probe, spelled exactly like the rest. */
export declare const systemHealthSchema: z.ZodObject<{
    database: z.ZodObject<{
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latency_ms: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    redis: z.ZodObject<{
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latency_ms: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    queues: z.ZodObject<{
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latency_ms: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    storage: z.ZodObject<{
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latency_ms: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    web: z.ZodObject<{
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latency_ms: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    overall: z.ZodObject<{
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latency_ms: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemHealth = z.infer<typeof systemHealthSchema>;
export declare const systemHealthResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        database: z.ZodObject<{
            status: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
            latency_ms: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        redis: z.ZodObject<{
            status: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
            latency_ms: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        queues: z.ZodObject<{
            status: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
            latency_ms: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        storage: z.ZodObject<{
            status: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
            latency_ms: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        web: z.ZodObject<{
            status: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
            latency_ms: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        overall: z.ZodObject<{
            status: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
            latency_ms: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemHealthResponse = z.infer<typeof systemHealthResponseSchema>;
/** C-OPSY-07: versions and uptime ONLY — never a secret, never a connection string. */
export declare const systemInfoSchema: z.ZodObject<{
    strapi_version: z.ZodString;
    node_version: z.ZodString;
    uptime_s: z.ZodNumber;
    env: z.ZodString;
    database: z.ZodObject<{
        client: z.ZodString;
    }, z.core.$strip>;
    timezone: z.ZodString;
    queues: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SystemInfo = z.infer<typeof systemInfoSchema>;
export declare const systemInfoResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        strapi_version: z.ZodString;
        node_version: z.ZodString;
        uptime_s: z.ZodNumber;
        env: z.ZodString;
        database: z.ZodObject<{
            client: z.ZodString;
        }, z.core.$strip>;
        timezone: z.ZodString;
        queues: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemInfoResponse = z.infer<typeof systemInfoResponseSchema>;
/** One applied user migration, newest first as the server orders them. */
export declare const systemMigrationRowSchema: z.ZodObject<{
    name: z.ZodString;
    time: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type SystemMigrationRow = z.infer<typeof systemMigrationRowSchema>;
export declare const systemMigrationsSchema: z.ZodObject<{
    rows: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        time: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    count: z.ZodNumber;
}, z.core.$strip>;
export type SystemMigrations = z.infer<typeof systemMigrationsSchema>;
export declare const systemMigrationsResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        rows: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            time: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        count: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemMigrationsResponse = z.infer<typeof systemMigrationsResponseSchema>;
/** C-OPSY-04: one recorded backup ledger row (newest first as the server orders them). */
export declare const opsBackupRecordSchema: z.ZodObject<{
    documentId: z.ZodString;
    filename: z.ZodString;
    bytes: z.ZodCoercedNumber<unknown>;
    status: z.ZodEnum<{
        failed: "failed";
        succeeded: "succeeded";
    }>;
    started_at: z.ZodString;
    finished_at: z.ZodNullable<z.ZodString>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    database: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type OpsBackupRecord = z.infer<typeof opsBackupRecordSchema>;
/** The list is a bare array of rows (server: `ctx.body = { data: backup().list(50) }`). */
export declare const systemBackupsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        filename: z.ZodString;
        bytes: z.ZodCoercedNumber<unknown>;
        status: z.ZodEnum<{
            failed: "failed";
            succeeded: "succeeded";
        }>;
        started_at: z.ZodString;
        finished_at: z.ZodNullable<z.ZodString>;
        error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        database: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SystemBackupsResponse = z.infer<typeof systemBackupsResponseSchema>;
export declare const SystemHealthOperation: Readonly<{
    contractId: "C-OPSY-06";
    method: "GET";
    path: "/api/ops/system/health";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            database: z.ZodObject<{
                status: z.ZodEnum<{
                    up: "up";
                    down: "down";
                }>;
                latency_ms: z.ZodNumber;
                detail: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            redis: z.ZodObject<{
                status: z.ZodEnum<{
                    up: "up";
                    down: "down";
                }>;
                latency_ms: z.ZodNumber;
                detail: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            queues: z.ZodObject<{
                status: z.ZodEnum<{
                    up: "up";
                    down: "down";
                }>;
                latency_ms: z.ZodNumber;
                detail: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            storage: z.ZodObject<{
                status: z.ZodEnum<{
                    up: "up";
                    down: "down";
                }>;
                latency_ms: z.ZodNumber;
                detail: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            web: z.ZodObject<{
                status: z.ZodEnum<{
                    up: "up";
                    down: "down";
                }>;
                latency_ms: z.ZodNumber;
                detail: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            overall: z.ZodObject<{
                status: z.ZodEnum<{
                    up: "up";
                    down: "down";
                }>;
                latency_ms: z.ZodNumber;
                detail: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const SystemInfoOperation: Readonly<{
    contractId: "C-OPSY-07";
    method: "GET";
    path: "/api/ops/system/info";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            strapi_version: z.ZodString;
            node_version: z.ZodString;
            uptime_s: z.ZodNumber;
            env: z.ZodString;
            database: z.ZodObject<{
                client: z.ZodString;
            }, z.core.$strip>;
            timezone: z.ZodString;
            queues: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const SystemMigrationsOperation: Readonly<{
    contractId: "C-OPSY-10";
    method: "GET";
    path: "/api/ops/system/migrations";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            rows: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                time: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>>;
            count: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const SystemBackupsOperation: Readonly<{
    contractId: "C-OPSY-04";
    method: "GET";
    path: "/api/ops/system/backups";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            filename: z.ZodString;
            bytes: z.ZodCoercedNumber<unknown>;
            status: z.ZodEnum<{
                failed: "failed";
                succeeded: "succeeded";
            }>;
            started_at: z.ZodString;
            finished_at: z.ZodNullable<z.ZodString>;
            error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            database: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
/** C-OPSY-01 cache clear — `{ scope, keys_cleared }`; scope echoes the request. */
export declare const systemCacheClearRequestSchema: z.ZodObject<{
    scope: z.ZodEnum<{
        search: "search";
        all: "all";
        settings: "settings";
        legal: "legal";
    }>;
}, z.core.$strip>;
export type SystemCacheClearRequest = z.infer<typeof systemCacheClearRequestSchema>;
export declare const systemCacheClearResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        scope: z.ZodString;
        keys_cleared: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemCacheClearResponse = z.infer<typeof systemCacheClearResponseSchema>;
/** C-OPSY-02 sitemap regenerate — stamps the setting, revalidates the web app, counts URLs. */
export declare const systemSitemapResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        regenerated_at: z.ZodString;
        revalidated: z.ZodBoolean;
        urls: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemSitemapResponse = z.infer<typeof systemSitemapResponseSchema>;
/** C-OPSY-03 backup run — returns the recorded row (succeeded or, on failure, nothing: it throws). */
export declare const systemBackupRunResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        filename: z.ZodString;
        bytes: z.ZodCoercedNumber<unknown>;
        status: z.ZodEnum<{
            failed: "failed";
            succeeded: "succeeded";
        }>;
        started_at: z.ZodString;
        finished_at: z.ZodNullable<z.ZodString>;
        error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        database: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SystemBackupRunResponse = z.infer<typeof systemBackupRunResponseSchema>;
export declare const pipelineQueueHealthSchema: z.ZodObject<{
    name: z.ZodString;
    waiting: z.ZodNumber;
    active: z.ZodNumber;
    failed: z.ZodNumber;
    completed: z.ZodNumber;
}, z.core.$strip>;
export type PipelineQueueHealth = z.infer<typeof pipelineQueueHealthSchema>;
export declare const pipelineHealthSchema: z.ZodObject<{
    queues: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        waiting: z.ZodNumber;
        active: z.ZodNumber;
        failed: z.ZodNumber;
        completed: z.ZodNumber;
    }, z.core.$strip>>;
    r_scoring: z.ZodEnum<{
        up: "up";
        down: "down";
    }>;
}, z.core.$strip>;
export type PipelineHealth = z.infer<typeof pipelineHealthSchema>;
export declare const pipelineHealthResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        queues: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            waiting: z.ZodNumber;
            active: z.ZodNumber;
            failed: z.ZodNumber;
            completed: z.ZodNumber;
        }, z.core.$strip>>;
        r_scoring: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type PipelineHealthResponse = z.infer<typeof pipelineHealthResponseSchema>;
/** Retry re-runs ONE failed job through BullMQ's own retry — never a rebuild. */
export declare const pipelineRetryRequestSchema: z.ZodObject<{
    queue: z.ZodString;
    job_id: z.ZodString;
}, z.core.$strip>;
export type PipelineRetryRequest = z.infer<typeof pipelineRetryRequestSchema>;
export declare const pipelineRetryResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        retried: z.ZodLiteral<true>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type PipelineRetryResponse = z.infer<typeof pipelineRetryResponseSchema>;
export declare const pipelineQueueDrainResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        queue: z.ZodString;
        removed: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type PipelineQueueDrainResponse = z.infer<typeof pipelineQueueDrainResponseSchema>;
export declare const pipelineQueuePauseRequestSchema: z.ZodObject<{
    paused: z.ZodBoolean;
}, z.core.$strip>;
export type PipelineQueuePauseRequest = z.infer<typeof pipelineQueuePauseRequestSchema>;
export declare const pipelineQueuePauseResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        queue: z.ZodString;
        paused: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export type PipelineQueuePauseResponse = z.infer<typeof pipelineQueuePauseResponseSchema>;
export declare const SystemCacheClearOperation: Readonly<{
    contractId: "C-OPSY-01";
    method: "POST";
    path: "/api/ops/system/cache/clear";
    request: z.ZodObject<{
        scope: z.ZodEnum<{
            search: "search";
            all: "all";
            settings: "settings";
            legal: "legal";
        }>;
    }, z.core.$strip>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            scope: z.ZodString;
            keys_cleared: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500, 502];
}>;
export declare const SystemSitemapOperation: Readonly<{
    contractId: "C-OPSY-02";
    method: "POST";
    path: "/api/ops/system/sitemap/regenerate";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            regenerated_at: z.ZodString;
            revalidated: z.ZodBoolean;
            urls: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500, 502];
}>;
export declare const SystemBackupRunOperation: Readonly<{
    contractId: "C-OPSY-03";
    method: "POST";
    path: "/api/ops/system/backup";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            documentId: z.ZodString;
            filename: z.ZodString;
            bytes: z.ZodCoercedNumber<unknown>;
            status: z.ZodEnum<{
                failed: "failed";
                succeeded: "succeeded";
            }>;
            started_at: z.ZodString;
            finished_at: z.ZodNullable<z.ZodString>;
            error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            database: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500, 502];
}>;
export declare const PipelineHealthOperation: Readonly<{
    contractId: "C-OPS-03";
    method: "GET";
    path: "/api/ops/pipeline/health";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            queues: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                waiting: z.ZodNumber;
                active: z.ZodNumber;
                failed: z.ZodNumber;
                completed: z.ZodNumber;
            }, z.core.$strip>>;
            r_scoring: z.ZodEnum<{
                up: "up";
                down: "down";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const PipelineRetryOperation: Readonly<{
    contractId: "C-OPS-03";
    method: "POST";
    path: "/api/ops/pipeline/retry";
    request: z.ZodObject<{
        queue: z.ZodString;
        job_id: z.ZodString;
    }, z.core.$strip>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            retried: z.ZodLiteral<true>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500, 502];
}>;
export declare const PipelineQueueDrainOperation: Readonly<{
    contractId: "C-OPSY-08";
    method: "POST";
    path: "/api/ops/pipeline/queues/:name/drain";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            queue: z.ZodString;
            removed: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500, 502];
}>;
export declare const PipelineQueuePauseOperation: Readonly<{
    contractId: "C-OPSY-09";
    method: "POST";
    path: "/api/ops/pipeline/queues/:name/pause";
    request: z.ZodObject<{
        paused: z.ZodBoolean;
    }, z.core.$strip>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            queue: z.ZodString;
            paused: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500, 502];
}>;
