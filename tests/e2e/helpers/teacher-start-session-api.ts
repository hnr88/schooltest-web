import { expect, type APIRequestContext } from '@playwright/test';

import {
  teacherTestSessionsResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

import { API_BASE } from './teacher-auth-rail';

// S8 — the Node-side half of the start-session spec. Every value is read LIVE off
// the Strapi the modal talks to and parsed through the shipped Zod mirrors. The
// busy set is an INDEPENDENT oracle of the server's one-test-at-a-time rule
// (schooltest-api sitting/lib/members.ts), so the modal's greying is checked
// against the API, never against the modal's own lib.

const IN_PROGRESS = new Set(['joined', 'in_progress', 'stalled', 'paused']);
const auth = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });

interface JoinBody {
  jwt?: string;
  error?: { status: number; details?: { reason?: string } };
}

async function listSittings(
  request: APIRequestContext,
  jwt: string,
  params: Record<string, string>,
): Promise<TeacherTestSession[]> {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions`, { headers: auth(jwt), params });
  expect(response.status(), `GET /api/teacher/test-sessions ${JSON.stringify(params)}`).toBe(200);
  return teacherTestSessionsResponseSchema.parse(await response.json()).sessions;
}

export function openSittingsOf(request: APIRequestContext, jwt: string, classId: string) {
  return listSittings(request, jwt, { status: 'open', class: classId });
}

export function scheduledSittingsOf(request: APIRequestContext, jwt: string, classId: string) {
  return listSittings(request, jwt, { status: 'scheduled', class: classId });
}

/** When the class's newest sitting that actually ran was opened ("Last session"); null when none. */
export async function lastSessionOpenedAt(
  request: APIRequestContext,
  jwt: string,
  classId: string,
): Promise<string | null> {
  const rows = await listSittings(request, jwt, { status: 'closed', class: classId, page: '1', pageSize: '20' });
  const ran = rows
    .filter((row) => row.phase !== 'cancelled' && row.opened_at !== null)
    .map((row) => row.opened_at ?? '');
  return ran.sort().at(-1) ?? null;
}

/** Named members of an open sitting, plus whoever holds an in-progress session in a whole-class one. */
export async function busyStudentIds(
  request: APIRequestContext,
  jwt: string,
  classId: string,
): Promise<Set<string>> {
  const busy = new Set<string>();
  for (const sitting of await openSittingsOf(request, jwt, classId)) {
    if (Array.isArray(sitting.member_student_ids)) {
      for (const id of sitting.member_student_ids) busy.add(id);
      continue;
    }
    const response = await request.get(
      `${API_BASE}/api/teacher/test-sessions/${sitting.sitting_document_id}/monitor`,
      { headers: auth(jwt) },
    );
    expect(response.status(), 'GET /api/teacher/test-sessions/:id/monitor').toBe(200);
    for (const tile of testSessionMonitorResponseSchema.parse(await response.json()).students) {
      if (IN_PROGRESS.has(tile.state)) busy.add(tile.student_document_id);
    }
  }
  return busy;
}

/** The desktop app's own join (C-SITTING-JOIN, legacy arm: code + picked student). */
export async function joinSitting(
  request: APIRequestContext,
  code: string,
  studentDocumentId: string,
): Promise<{ status: number; body: JoinBody }> {
  const response = await request.post(`${API_BASE}/api/sittings/join`, {
    data: { code, student_document_id: studentDocumentId },
  });
  return { status: response.status(), body: (await response.json()) as JoinBody };
}

/** What the desktop waiting room polls (C-SIT-STATUS) with the student's own JWT. */
export async function desktopStatus(
  request: APIRequestContext,
  sittingId: string,
  studentJwt: string,
): Promise<{ phase?: string; settings?: unknown }> {
  const response = await request.get(`${API_BASE}/api/sittings/${sittingId}/status`, {
    headers: auth(studentJwt),
  });
  expect(response.status(), 'GET /api/sittings/:id/status').toBe(200);
  return (await response.json()) as { phase?: string; settings?: unknown };
}

/** Whether the running API lists bookings yet (B1b): a pre-B1b build refuses the filter. */
export async function bookingsDeployed(request: APIRequestContext, jwt: string): Promise<boolean> {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions`, {
    headers: auth(jwt),
    params: { status: 'scheduled' },
  });
  return response.status() === 200;
}

/** The started sitting as the API holds it: running, exactly these members, these settings; returns its code. */
export async function expectStartedSitting(
  request: APIRequestContext,
  jwt: string,
  classId: string,
  sittingId: string,
  members: readonly string[],
  settings: Record<string, unknown>,
): Promise<string> {
  const row = (await openSittingsOf(request, jwt, classId)).find((entry) => entry.sitting_document_id === sittingId);
  expect(row?.phase).toBe('running');
  expect([...(row?.member_student_ids ?? [])].sort()).toEqual([...members].sort());
  expect(row?.settings).toMatchObject(settings);
  expect(row?.code).toMatch(/^\d{6}$/);
  return row?.code ?? '';
}

/** The desktop's own path: a non-member is refused not_on_roster; a member joins and reads running + settings. */
export async function expectDesktopJoin(
  request: APIRequestContext,
  sitting: { id: string; code: string; member: string; outsider: string; settings: Record<string, unknown> },
): Promise<void> {
  const refused = await joinSitting(request, sitting.code, sitting.outsider);
  expect(refused.status).toBe(404);
  expect(refused.body.error?.details?.reason).toBe('not_on_roster');
  const joined = await joinSitting(request, sitting.code, sitting.member);
  expect(joined.status, JSON.stringify(joined.body)).toBe(200);
  const status = await desktopStatus(request, sitting.id, joined.body.jwt ?? '');
  expect(status.phase).toBe('running');
  expect(status.settings).toMatchObject(sitting.settings);
}

/** A booking's window edge as HH:MM in the zone the server echoed (null when it is not listed). */
export async function bookingWindowHm(
  request: APIRequestContext,
  jwt: string,
  classId: string,
  sittingId: string,
  edge: 'opens_at' | 'closes_at',
): Promise<string | null> {
  const row = (await scheduledSittingsOf(request, jwt, classId)).find((entry) => entry.sitting_document_id === sittingId);
  if (!row?.window || row.phase !== 'scheduled') return null;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: row.window.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(row.window[edge]));
}

/** Leaves the class as found: close what the spec started, cancel what it booked. */
export async function releaseSitting(
  request: APIRequestContext,
  jwt: string,
  sittingId: string,
  action: 'close' | 'cancel',
): Promise<number> {
  const response = await request.post(`${API_BASE}/api/teacher/test-sessions/${sittingId}/${action}`, {
    headers: auth(jwt),
  });
  return response.status();
}
