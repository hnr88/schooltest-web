/**
 * OPS-008 contract fixtures — web-side twin of schooltest-api's ops-portal helper.
 * Real POST/DELETE rows only; env and credentials resolved lazily so vitest can import it.
 */
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { z, type ZodType } from 'zod';
import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  dataEnvelope,
  documentIdSchema,
  errorEnvelopeSchema,
} from '@schooltest/ops-contracts';

import { roleCredentials, type AppRole } from './credentials';
import { loginCached } from './http';

export const OPS_FIXTURE_ROLES = [
  'ops', 'ops_support', 'teacher', 'school_admin',
  'parent', 'student', 'missing_token', 'invalid_token',
] as const;
export type OpsFixtureRole = (typeof OPS_FIXTURE_ROLES)[number];

export const INVALID_TOKEN = 'invalid.invalid.invalid';

export class OpsFixturePrerequisiteError extends Error {}

// Resolved lazily: vitest injects NEXT_PUBLIC_API_BASE_URL dummies, e2e sets E2E_API_BASE_URL.
function apiBaseUrl(): string {
  return (
    process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500'
  );
}

// ops_support has no seeded account; the stack predates the role.
export function opsSupportCredentials(): { email: string; password: string } {
  const email = process.env.E2E_OPS_SUPPORT_EMAIL;
  const password = process.env.E2E_OPS_SUPPORT_PASSWORD;
  if (!email || !password) {
    throw new OpsFixturePrerequisiteError(
      '[ops-fixture] ops_support requires E2E_OPS_SUPPORT_EMAIL and E2E_OPS_SUPPORT_PASSWORD.',
    );
  }
  return { email, password };
}

export function fixtureHeaders(role: OpsFixtureRole, jwt?: string): Record<string, string> {
  const headers: Record<string, string> = { [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION };
  if (role === 'missing_token') return headers;
  if (role === 'invalid_token') return { ...headers, Authorization: `Bearer ${INVALID_TOKEN}` };
  if (!jwt) throw new Error(`[ops-fixture] role "${role}" needs a live JWT from fixtureAuthContext`);
  return { ...headers, Authorization: `Bearer ${jwt}` };
}

export function opsFixtureLabel(prefix: string): string {
  const worker = process.env.TEST_WORKER_INDEX ?? process.env.VITEST_WORKER_ID ?? '0';
  return `${prefix} w${worker} ${Date.now().toString(36)} ${crypto.randomUUID().slice(0, 13)}`;
}

const ROLE_MAP: Partial<Record<OpsFixtureRole, AppRole>> = {
  ops: 'opsApi',
  teacher: 'teacher',
  school_admin: 'schoolAdmin',
  parent: 'parent',
  student: 'student',
};

/** A live JWT for any fixture role (null for missing_token, the sentinel for invalid_token). */
export async function fixtureAuthContext(
  request: APIRequestContext,
  role: OpsFixtureRole,
): Promise<{ role: OpsFixtureRole; jwt: string | null }> {
  if (role === 'missing_token') return { role, jwt: null };
  if (role === 'invalid_token') return { role, jwt: INVALID_TOKEN };
  if (role === 'ops_support') {
    return { role, jwt: await loginCached(request, apiBaseUrl(), opsSupportCredentials()) };
  }
  const mapped = ROLE_MAP[role];
  if (!mapped) throw new Error(`[ops-fixture] no login path for role "${role}"`);
  return { role, jwt: await loginCached(request, apiBaseUrl(), roleCredentials(mapped)) };
}

function parseOrThrow<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`[ops-fixture] "${label}" failed schema validation:\n${issues}`);
}

export function assertErrorEnvelopeForStatus(body: unknown, httpStatus: number) {
  const envelope = parseOrThrow(errorEnvelopeSchema, body, 'error envelope');
  if (envelope.error.status !== httpStatus) {
    throw new Error(
      `[ops-fixture] error envelope status ${envelope.error.status} does not match HTTP ${httpStatus}`,
    );
  }
  return envelope;
}

export function parseOpsEnvelope<T>(schema: ZodType<T>, body: unknown, label: string): T {
  return parseOrThrow(dataEnvelope(schema), body, label).data;
}

export async function expectOpsError(res: APIResponse, httpStatus: number) {
  if (res.status() !== httpStatus) {
    throw new Error(`[ops-fixture] expected HTTP ${httpStatus}, got ${res.status()}: ${await res.text()}`);
  }
  return assertErrorEnvelopeForStatus(await res.json(), httpStatus);
}

export async function expectOpsSuccess<T>(
  res: APIResponse,
  httpStatus: number,
  schema: ZodType<T>,
  label: string,
): Promise<T> {
  if (res.status() !== httpStatus) {
    throw new Error(`[ops-fixture] expected HTTP ${httpStatus}, got ${res.status()}: ${await res.text()}`);
  }
  return parseOpsEnvelope(schema, await res.json(), label);
}

export async function expectCrossSchoolDenied(res: APIResponse) {
  const status = res.status();
  if (status !== 403 && status !== 404) {
    throw new Error(
      `[ops-fixture] cross-school access must be 403 or 404, got ${status}: ${await res.text()}`,
    );
  }
  return assertErrorEnvelopeForStatus(await res.json(), status);
}

/** Tracks fixture rows so a test deletes exactly what it created, newest first. */
export class OpsFixtureLedger {
  private readonly entries: { kind: 'school' | 'user'; documentId: string }[] = [];

  track(kind: 'school' | 'user', documentId: string): void {
    parseOrThrow(documentIdSchema, documentId, `ledger ${kind} documentId`);
    this.entries.push({ kind, documentId });
  }

  get size(): number {
    return this.entries.length;
  }

  async cleanup(request: APIRequestContext): Promise<void> {
    const headers = fixtureHeaders(
      'ops',
      await loginCached(request, apiBaseUrl(), roleCredentials('opsApi')),
    );
    for (const entry of [...this.entries].reverse()) {
      const path = entry.kind === 'school' ? 'schools' : 'users';
      const res = await request.delete(`${apiBaseUrl()}/api/ops/${path}/${entry.documentId}`, {
        headers,
      });
      if (!res.ok()) {
        console.warn(
          `[ops-fixture] cleanup DELETE /api/ops/${path}/${entry.documentId} -> HTTP ${res.status()}`,
        );
      }
    }
    this.entries.length = 0;
  }
}

export async function createOpsFixtureSchool(
  request: APIRequestContext,
  ledger: OpsFixtureLedger,
  label: string,
): Promise<{ documentId: string; name: string }> {
  const name = opsFixtureLabel(label);
  const headers = fixtureHeaders(
    'ops',
    await loginCached(request, apiBaseUrl(), roleCredentials('opsApi')),
  );
  const res = await request.post(`${apiBaseUrl()}/api/schools`, {
    headers,
    data: {
      name,
      contact_email: `${crypto.randomUUID()}@fixture.schooltest.local`,
      suburb: 'Probe',
      state: 'NSW',
      postcode: '2000',
      sector: 'non-government',
    },
  });
  const status = res.status();
  if (status !== 200 && status !== 201) {
    throw new Error(`[ops-fixture] POST /api/schools expected 200|201, got ${status}: ${await res.text()}`);
  }
  const { documentId } = parseOpsEnvelope(
    z.object({ documentId: documentIdSchema }),
    await res.json(),
    'create school',
  );
  ledger.track('school', documentId);
  return { documentId, name };
}
