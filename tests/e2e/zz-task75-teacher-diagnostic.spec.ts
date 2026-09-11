import { expect, test, type APIRequestContext } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureTeacherCredentials, roleCredentials } from './helpers/credentials';

// Task 75 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-RPT-01, the class diagnostic, answers only the class's own teacher and the school's
// admin; a foreign teacher of the SAME school and a parent are refused. The owner's 200
// sits beside the refusals, so a lone 403 cannot be a broken fixture.
//
// Retired with Teacher Portal v2: the teacher-facing /dashboard/teach/results diagnostic
// screen (mastery list, heat map, drill-down, empty and refused states). Teachers read a
// class on the class detail's Teaching insights tab and the school admin's embedded
// diagnostic is proven there too (teacher-v2/insights-tab.spec.ts); the refused-state test
// intercepted the network (RULE 0: real data only).
const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
/**
 * teacher2 is in the SAME school on purpose: a teacher from another school would be
 * refused for TENANCY reasons, proving nothing about OWNERSHIP.
 */
const FOREIGN_TEACHER = roleCredentials('teacher2');
const PARENT = roleCredentials('parent');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"

async function diagnosticStatus(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<number> {
  const jwt = await loginCached(request, API, credentials);
  const response = await fetchWithRetry(() =>
    request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  return response.status();
}

test.describe('task 75: C-RPT-01 answers only the class teacher and the school admin', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('the class teacher and the school admin 200; a foreign teacher and a parent 403', async ({
    request,
  }) => {
    expect(await diagnosticStatus(request, TEACHER), 'the class teacher').toBe(200);
    expect(await diagnosticStatus(request, SCHOOL_ADMIN), 'the school admin').toBe(200);
    expect(await diagnosticStatus(request, FOREIGN_TEACHER), 'a foreign teacher').toBe(403);
    expect(await diagnosticStatus(request, PARENT), 'a parent').toBe(403);
  });
});
