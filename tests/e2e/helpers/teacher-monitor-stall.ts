import { expect, type APIRequestContext } from '@playwright/test';

import type { TestSessionMonitorResponse } from '@/modules/teacher/types/teacher-session.types';
import type { MonitorState } from '@/modules/teacher/types/teacher.types';

import { runSql } from './auth-db';
import { readMonitor } from './teacher-live-monitor-api';

// Task 053 — flow 12's honest amber path. The stall cut is GLOBAL server config
// (the ACTIVE `api::config.config` row, CT-8), so this file lowers it and puts it
// back, and every read is the row itself rather than a number the spec remembers.
//
// The student's idleness is REAL wall-clock idleness: nothing here backdates a
// response, moves a session's timestamps or writes a heartbeat. The ONLY write is
// `configs.stall_threshold_minutes` on the active row, which the spec restores in
// the same test and again in its afterAll — a sibling lane reads this database.

/** The whole ACTIVE Config row, for the before/after restore proof. */
export function configFingerprint(): string {
  return runSql(
    `select id, document_id, stall_threshold_minutes, max_idle_minutes,
            teacher_mastery_bands::text, active, updated_at
       from configs where active = true`,
  );
}

/** `Config.stall_threshold_minutes` — the one number that decides amber (CT-8). */
export function readStallThreshold(): number {
  const rows = runSql(`select stall_threshold_minutes from configs where active = true`)
    .split('\n')
    .filter((row) => row.trim().length > 0);
  expect(rows.length, 'there must be exactly one ACTIVE Config row (CT-8)').toBe(1);
  const minutes = Number(rows[0]);
  expect(Number.isInteger(minutes), `stall_threshold_minutes is not an integer: ${rows[0]}`).toBe(
    true,
  );
  return minutes;
}

/** Writes the GLOBAL stall cut; returns what the row reads back afterwards. */
export function writeStallThreshold(minutes: number): number {
  const changed = runSql(
    `with moved as (
       update configs set stall_threshold_minutes = ${minutes} where active = true returning 1
     ) select count(*) from moved`,
  );
  expect(Number(changed), 'the stall write must touch exactly one row').toBe(1);
  return readStallThreshold();
}

/**
 * Seconds since the student last did anything, derived from the SAME rows C-TS-3
 * derives `inactive_minutes` from: newest `response.presented_at`, else
 * `session.started_at`. These columns are `timestamp without time zone` holding
 * local wall time (the API converts on the wire), so `localtimestamp` is the
 * matching clock.
 */
export function idleSeconds(sessionDocumentId: string): number {
  return Number(
    runSql(
      `select extract(epoch from (localtimestamp - coalesce(
          (select max(r.presented_at) from responses r
             join responses_session_lnk l on l.response_id = r.id
            where l.session_id = s.id), s.started_at)))
         from sessions s where s.document_id = '${sessionDocumentId}'`,
    ),
  );
}

const POLL_MS = 2_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Waits out REAL idle time, polling Postgres for the age C-TS-3 will read. */
export async function waitForIdleSeconds(
  sessionDocumentId: string,
  seconds: number,
  capMs = 180_000,
): Promise<number> {
  const deadline = Date.now() + capMs;
  let age = idleSeconds(sessionDocumentId);
  while (age < seconds) {
    if (Date.now() > deadline)
      throw new Error(`idle age stuck at ${age}s for ${sessionDocumentId}`);
    await sleep(Math.min(POLL_MS + (seconds - age) * 1000, 15_000));
    age = idleSeconds(sessionDocumentId);
  }
  return age;
}

/**
 * Puts the GLOBAL cut back and PROVES it three ways: the Config row reads the
 * original again, the running server echoes it on the wire, and the student it
 * flagged is no longer stalled. The whole ACTIVE row must also be byte-identical
 * to the fingerprint taken before the write — nothing else moved.
 */
export async function expectStallRestored(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
  studentDocumentId: string,
  original: number,
  fingerprint: string,
): Promise<TestSessionMonitorResponse> {
  expect(writeStallThreshold(original), 'the Config row did not go back').toBe(original);
  const restored = await waitForState(
    request,
    jwt,
    sittingDocumentId,
    studentDocumentId,
    'in_progress',
  );
  expect(restored.stall_threshold_minutes, 'the wire still carries the lowered cut').toBe(original);
  expect(restored.summary).toMatchObject({ stalled: 0, in_progress: 1 });
  expect(configFingerprint(), 'the ACTIVE Config row must be byte-identical').toBe(fingerprint);
  return restored;
}

/** Polls the REAL C-TS-3 read until the server itself reports `state`. */
export async function waitForState(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
  studentDocumentId: string,
  state: MonitorState,
  timeoutMs = 30_000,
): Promise<TestSessionMonitorResponse> {
  const deadline = Date.now() + timeoutMs;
  let last: TestSessionMonitorResponse | null = null;
  for (;;) {
    last = await readMonitor(request, jwt, sittingDocumentId);
    const tile = last.students.find((row) => row.student_document_id === studentDocumentId);
    if (tile?.state === state) return last;
    if (Date.now() > deadline) {
      throw new Error(
        `C-TS-3 never reported ${state} for ${studentDocumentId}: ${JSON.stringify(last.students)}`,
      );
    }
    await sleep(POLL_MS);
  }
}
