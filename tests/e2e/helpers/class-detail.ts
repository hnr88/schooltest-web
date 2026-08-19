import { expect, type APIRequestContext, type Page } from '@playwright/test';

// Deep imports, not the module barrel: the barrel pulls React components into
// this Node test process. Same schemas the app parses with — the point of the
// import is that a contract drift fails these specs.
import {
  classDetailSchema,
  classStudentDetailSchema,
} from '@/modules/classes/schemas/class-detail.schema';
import type {
  ClassDetail,
  ClassStudentDetail,
} from '@/modules/classes/types/class-detail.types';

import { loginCached } from './http';
import { ROLE_CREDENTIALS } from './roles';
import { fixtureClassId } from './fixture-class';

// Shared plumbing for the class-detail + drill-down specs (spec §1/§2).
// Every live read is parsed through the SAME shared Zod schemas the app uses,
// so a server/client contract drift fails these specs rather than silently
// reshaping in a component.

export const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';

/** The seeded School A class the mission is proven against. */
export const FIXTURE_CLASS_ID = fixtureClassId();

/** A class of the same school with no students — the empty-state case. */
export const EMPTY_CLASS_ID = 'gaossopxive6fvqy22km4hkv';

export const ACARA_PHASES = ['Beginning', 'Emerging', 'Developing', 'Consolidating'] as const;

export function schoolAdminJwt(request: APIRequestContext): Promise<string> {
  return loginCached(request, API, {
    email: ROLE_CREDENTIALS.schoolAdmin.email,
    password: ROLE_CREDENTIALS.schoolAdmin.password,
  });
}

async function readJson(
  request: APIRequestContext,
  jwt: string,
  path: string,
): Promise<unknown> {
  const res = await request.get(`${API}${path}`, { headers: { Authorization: `Bearer ${jwt}` } });
  expect(res.status(), `${path} -> ${await res.text()}`).toBe(200);
  return ((await res.json()) as { data: unknown }).data;
}

/** C-CLS-05, parsed through the app's own schema. */
export async function apiClassDetail(
  request: APIRequestContext,
  jwt: string,
  classDocumentId = FIXTURE_CLASS_ID,
): Promise<ClassDetail> {
  return classDetailSchema.parse(
    await readJson(request, jwt, `/api/schools/me/classes/${classDocumentId}`),
  );
}

/** C-CLS-06, parsed through the app's own schema. */
export async function apiClassStudent(
  request: APIRequestContext,
  jwt: string,
  studentDocumentId: string,
  classDocumentId = FIXTURE_CLASS_ID,
): Promise<ClassStudentDetail> {
  return classStudentDetailSchema.parse(
    await readJson(
      request,
      jwt,
      `/api/schools/me/classes/${classDocumentId}/students/${studentDocumentId}`,
    ),
  );
}

export function fullName(person: { given_name: string | null; family_name: string | null }): string {
  return [person.given_name, person.family_name].filter(Boolean).join(' ').trim();
}

/** The first roster student whose given slot is completed WITH real evidence. */
export function studentWithEvidence(detail: ClassDetail, slot: 'A' | 'B') {
  return detail.students.find((student) =>
    student.tests.some(
      (test) =>
        test.test_id === slot &&
        test.status === 'completed' &&
        test.overall_score !== null &&
        test.acara_phase !== null &&
        test.subskills !== null,
    ),
  );
}

/** Opens the class detail page as the seeded school_admin. */
export async function gotoClassDetail(page: Page, classDocumentId = FIXTURE_CLASS_ID): Promise<void> {
  await page.goto(`/dashboard/school/classes/${classDocumentId}`);
  await expect(page.locator('[data-surface="school-admin-class-detail"]')).toBeVisible();
}
