import { expect, type APIRequestContext } from '@playwright/test';

import { testSessionMonitorResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  TeacherTestSession,
  TestSessionMonitorResponse,
} from '@/modules/teacher/types/teacher-session.types';
import type { MonitorState } from '@/modules/teacher/types/teacher.types';

import { API_BASE } from './teacher-auth-rail';

// Task 037 — the read half of the live-monitoring harness (C-TS-3); the join half
// lives in teacher-live-monitor-join.ts. Nothing here fixtures a tile: every state
// is read LIVE off the same Strapi the browser polls and parsed through the
// SHIPPED Zod mirror, so a payload that diverges from .qa/CONTRACTS.md throws here
// instead of being matched loosely.

/** C-TS-3 — the whole live payload, strict-parsed. */
export async function readMonitor(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<TestSessionMonitorResponse> {
  const response = await request.get(
    `${API_BASE}/api/teacher/test-sessions/${sittingDocumentId}/monitor`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(response.status(), `GET monitor ${sittingDocumentId}`).toBe(200);
  return testSessionMonitorResponseSchema.parse(await response.json());
}

/** A sitting whose monitor read does NOT answer 200, with the server's own reason. */
export interface MonitorAnomaly {
  sittingDocumentId: string;
  status: number;
  message: string;
}

export interface MonitorScan {
  covering: Map<MonitorState, TestSessionMonitorResponse>;
  anomalies: MonitorAnomaly[];
}

/**
 * One real sitting per requested state, discovered by walking the caller's own
 * sittings. States are never manufactured: if the datastore holds no student in
 * some state the scan FAILS naming it, rather than inventing a tile.
 */
export async function findSittingsCovering(
  request: APIRequestContext,
  jwt: string,
  sessions: readonly TeacherTestSession[],
  states: readonly MonitorState[],
  scanLimit = 400,
): Promise<MonitorScan> {
  const covering = new Map<MonitorState, TestSessionMonitorResponse>();
  const anomalies: MonitorAnomaly[] = [];
  // A `completed` count above zero is the C-TS-2 signal that a sitting holds a
  // SUBMITTED student, so those are walked first; the rest carry the live states.
  const ordered = [
    ...sessions.filter((session) => session.completed > 0),
    ...sessions.filter((session) => session.completed === 0),
  ];

  for (const session of ordered.slice(0, scanLimit)) {
    if (covering.size === states.length) break;
    const id = session.sitting_document_id;
    const response = await request.get(`${API_BASE}/api/teacher/test-sessions/${id}/monitor`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    // A non-200 is RECORDED, not swallowed: the spec re-opens the first one in the
    // browser and proves the UI answers with its error branch, never a fake grid.
    if (response.status() !== 200) {
      const body = (await response.json()) as { error?: { message?: string } };
      anomalies.push({
        sittingDocumentId: id,
        status: response.status(),
        message: body.error?.message ?? '',
      });
      continue;
    }
    const monitor = testSessionMonitorResponseSchema.parse(await response.json());
    for (const state of states) {
      if (covering.has(state)) continue;
      if (monitor.students.some((student) => student.state === state)) covering.set(state, monitor);
    }
  }

  const missing = states.filter((state) => !covering.has(state));
  if (missing.length > 0) {
    throw new Error(`no sitting in the first ${scanLimit} carries: ${missing.join(', ')}`);
  }
  return { covering, anomalies };
}
