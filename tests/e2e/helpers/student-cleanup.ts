/**
 * Test hygiene for specs that create students.
 *
 * A spec that permanently grows `parent@schooltest.local`'s roster is a defect in
 * the test: 90 leaked fixtures pushed Mia/Jonas off the first page and broke
 * first-page assertions in `dashboard.spec.ts` and `settings-tabs.spec.ts`.
 * Specs that provision their OWN throwaway parent (`helpers/throwaway-parent.ts`)
 * do not need this; specs that must use the seeded parent — because the
 * notification feed under test is that parent's — call `deleteStudents` in a
 * `finally`, the way the api-side teardowns do.
 *
 * "Delete" follows the product's removal rules, as the seeded ops `apiadmin`:
 * - `DELETE /api/students/:documentId` (C-8 ops delete) removes a student with
 *   no assessment history;
 * - it REFUSES a student holding any session, result, response or exit request
 *   (400 STUDENT_HAS_HISTORY): history is kept while the school is active and
 *   such a student is removed by DEACTIVATION instead (C-CHD-04), through the
 *   route the ops Students tab calls,
 *   `POST /api/ops/schools/:school/students/:student/deactivate`.
 * The outcome is then CHECKED: the row reads 404, or `student_status:
 * 'archived'`. No raw SQL: `helpers/auth-db.ts`'s psql access stays scoped to
 * `auth_email_requests`.
 */
import { expect, type APIRequestContext } from '@playwright/test';

import { apiEnv } from './auth-db';
import { API_BASE_URL } from './mailpit';

const ADMIN = { identifier: 'apiadmin@schooltest.local', passwordEnv: 'SEED_APIADMIN_PASSWORD' };

let cachedAdminJwt: string | null = null;

/** Real POST /api/auth/local as the seeded users-permissions admin (cached per run). */
async function adminJwt(request: APIRequestContext): Promise<string> {
  if (cachedAdminJwt) return cachedAdminJwt;
  const res = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: ADMIN.identifier, password: apiEnv(ADMIN.passwordEnv) },
  });
  if (!res.ok()) throw new Error(`[e2e] admin login failed: ${res.status()} ${await res.text()}`);
  const { jwt } = (await res.json()) as { jwt?: string };
  if (!jwt) throw new Error('[e2e] admin login returned no jwt');
  cachedAdminJwt = jwt;
  return jwt;
}

interface StudentRead {
  student_status?: string;
  school?: { documentId?: string } | null;
}

async function readStudent(
  request: APIRequestContext,
  headers: Record<string, string>,
  documentId: string,
): Promise<{ status: number; row: StudentRead | null }> {
  const res = await request.get(`${API_BASE_URL}/api/students/${documentId}`, {
    headers,
    params: { 'fields[0]': 'student_status', 'populate[school][fields][0]': 'name' },
  });
  if (res.status() !== 200) return { status: res.status(), row: null };
  return { status: 200, row: ((await res.json()) as { data: StudentRead }).data };
}

/** Delete, or deactivate on STUDENT_HAS_HISTORY; throws when neither held. */
async function retireStudent(request: APIRequestContext, jwt: string, documentId: string): Promise<void> {
  const headers = { Authorization: `Bearer ${jwt}` };
  const del = await request.delete(`${API_BASE_URL}/api/students/${documentId}`, { headers });
  if (del.status() === 204 || del.status() === 404) {
    const after = await readStudent(request, headers, documentId);
    if (after.status !== 404) throw new Error(`still readable (HTTP ${after.status}) after its delete`);
    return;
  }

  const refusal = await del.text();
  let code: string | undefined;
  try {
    code = (JSON.parse(refusal) as { error?: { details?: { code?: string } } }).error?.details?.code;
  } catch {
    code = undefined;
  }
  if (del.status() !== 400 || code !== 'STUDENT_HAS_HISTORY') {
    throw new Error(`DELETE -> HTTP ${del.status()}: ${refusal.slice(0, 300)}`);
  }

  const schoolDocumentId = (await readStudent(request, headers, documentId)).row?.school?.documentId;
  if (!schoolDocumentId) throw new Error('holds history but has no school, so the ops deactivate cannot reach it');
  const deactivated = await request.post(
    `${API_BASE_URL}/api/ops/schools/${schoolDocumentId}/students/${documentId}/deactivate`,
    { headers },
  );
  if (deactivated.status() !== 200) {
    throw new Error(`deactivate -> HTTP ${deactivated.status()}: ${(await deactivated.text()).slice(0, 300)}`);
  }
  const status = (await readStudent(request, headers, documentId)).row?.student_status;
  if (status !== 'archived') throw new Error(`reads student_status '${status}' after its deactivate`);
}

/**
 * Retire every listed student: deleted when it has no history, deactivated
 * when it has. Never throws — this runs in a `finally`, so a cleanup failure
 * must not mask the assertion that actually failed — but a student left neither
 * deleted nor archived is recorded as a SOFT assertion failure, so the run still
 * goes red instead of leaking an ACTIVE student. Falsy ids are skipped
 * (creation may not have got that far).
 */
export async function deleteStudents(
  request: APIRequestContext,
  documentIds: readonly (string | undefined)[],
): Promise<void> {
  const ids = documentIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  const failures: string[] = [];
  try {
    const jwt = await adminJwt(request);
    await Promise.all(
      ids.map((documentId) =>
        retireStudent(request, jwt, documentId).catch((error: unknown) => {
          failures.push(`${documentId}: ${error instanceof Error ? error.message : String(error)}`);
        }),
      ),
    );
  } catch (error) {
    failures.push(`admin login: ${error instanceof Error ? error.message : String(error)}`);
  }
  expect
    .soft(failures, `students the cleanup left neither deleted nor archived:\n${failures.join('\n')}`)
    .toEqual([]);
}
