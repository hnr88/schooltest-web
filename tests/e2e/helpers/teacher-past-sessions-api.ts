import { expect, type APIRequestContext } from '@playwright/test';

import { teacherTestSessionsResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import {
  teacherDashboardResponseSchema,
  teacherTestsResponseSchema,
} from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { DashboardClass, TeacherTest } from '@/modules/teacher/types/teacher.types';

import { API_BASE } from './teacher-auth-rail';

// Task 036 — the Node-side half of the harness (contract C-TS-1/2/4 and C-TD-1/2).
// Nothing here fixtures a session: every value is read LIVE off the same Strapi the
// browser talks to and parsed through the SHIPPED Zod mirrors, so a response that
// diverges from .qa/CONTRACTS.md throws here instead of being compared against a
// loosened shape.

async function readJson(
  request: APIRequestContext,
  jwt: string,
  path: string,
): Promise<{ status: number; body: unknown }> {
  const response = await request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return { status: response.status(), body: (await response.json()) as unknown };
}

/** C-TS-2 — the rows the table must render, in the server's own order. */
export async function readSessions(
  request: APIRequestContext,
  jwt: string,
): Promise<readonly TeacherTestSession[]> {
  const { status, body } = await readJson(request, jwt, '/api/teacher/test-sessions');
  expect(status, 'GET /api/teacher/test-sessions').toBe(200);
  return teacherTestSessionsResponseSchema.parse(body).sessions;
}

/** C-TD-2 — the display label the Test column prints for each variant. */
export async function readTests(
  request: APIRequestContext,
  jwt: string,
): Promise<readonly TeacherTest[]> {
  const { status, body } = await readJson(request, jwt, '/api/teacher/tests');
  expect(status, 'GET /api/teacher/tests').toBe(200);
  return teacherTestsResponseSchema.parse(body).tests;
}

/** C-TD-1 — the classes the caller owns, for the C-TS-1 create below. */
export async function readClasses(
  request: APIRequestContext,
  jwt: string,
): Promise<readonly DashboardClass[]> {
  const { status, body } = await readJson(request, jwt, '/api/teacher/dashboard');
  expect(status, 'GET /api/teacher/dashboard').toBe(200);
  return teacherDashboardResponseSchema.parse(body).classes;
}

/** C-TS-1 — a REAL new sitting, so "appears after reload" is proven, not assumed. */
export async function createSession(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
  formDocumentId: string,
): Promise<string> {
  const response = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { class_document_id: classDocumentId, form_document_id: formDocumentId },
  });
  expect(response.status(), 'POST /api/teacher/test-sessions').toBe(201);
  const { sitting_document_id: id } = (await response.json()) as { sitting_document_id: string };
  return id;
}

/** C-TS-4 — closes the sitting this spec opened, so the surface is left as found. */
export async function closeSession(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<void> {
  const response = await request.post(
    `${API_BASE}/api/teacher/test-sessions/${sittingDocumentId}/close`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(response.status(), 'POST /api/teacher/test-sessions/:id/close').toBe(200);
}
