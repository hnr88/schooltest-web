/**
 * Test hygiene for specs that create children under the SEEDED parent.
 *
 * A spec that permanently grows `parent@schooltest.local`'s roster is a defect in
 * the test: 90 leaked fixtures pushed Mia/Jonas off the first page and broke
 * first-page assertions in `dashboard.spec.ts` and `settings-tabs.spec.ts`.
 * Specs that provision their OWN throwaway parent (`helpers/throwaway-parent.ts`)
 * do not need this; specs that must use the seeded parent — because the
 * notification feed under test is that parent's — call `deleteStudents` in a
 * `finally`, the way the api-side receptive journeys do.
 *
 * The delete goes through the REAL admin route (`DELETE /api/students/:documentId`,
 * IS_ADMIN policy) with the seeded `apiadmin` account, exactly like the api-side
 * `deleteStudent` helper. No raw SQL: `helpers/auth-db.ts`'s psql access stays
 * scoped to `auth_email_requests`.
 */
import type { APIRequestContext } from '@playwright/test';

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

/**
 * Delete every listed student through the real admin route. Never throws — this
 * runs in a `finally`, so a cleanup failure must not mask the assertion that
 * actually failed. Falsy ids are skipped (creation may not have got that far).
 */
export async function deleteStudents(
  request: APIRequestContext,
  documentIds: readonly (string | undefined)[],
): Promise<void> {
  const ids = documentIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  try {
    const jwt = await adminJwt(request);
    await Promise.all(
      ids.map((documentId) =>
        request
          .delete(`${API_BASE_URL}/api/students/${documentId}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          })
          .catch(() => undefined),
      ),
    );
  } catch {
    // Best effort — reported by the roster count, never by a masked assertion.
  }
}
