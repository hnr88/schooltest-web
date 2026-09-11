import { expect, test, type APIRequestContext } from '@playwright/test';

import { diagnosticAreaCode } from '@/modules/teach/lib/diagnostic-areas';

import { roleCredentials } from './helpers/credentials';
import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';

// Task 99 (st-mvp-pivot) live check: C-RPT-01 v2's "group by limiting attribute" block
// (mvp-updates spec 4.9/4.10) is coherent with its own mastery rows, and every group
// has a friendly area label — resolved through the SAME attribute → area mapping the
// teach screens render with (`diagnosticAreaCode`), so an unknown attribute fails loud.
// The class is read live: the first of the journey teacher's classes whose diagnostic
// carries groups (the fixture teacher's class roster is archived on this database).
//
// Retired with Teacher Portal v2: the teacher-facing /dashboard/teach/results groups
// panel, its drill, copy guard and empty class. The school admin's GroupPanel is proven
// on live data by teacher-v2/insights-tab.spec.ts.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = roleCredentials('teacher');
const NOT_YET_ASSESSED = 'not_yet_assessed';

interface DiagnosticPayload {
  mastery: Array<{ student_ref: string }>;
  groups: Array<{ limiting_attribute: string; student_refs: string[]; count: number }>;
}

async function getJson<T>(request: APIRequestContext, jwt: string, path: string): Promise<T> {
  const response = await fetchWithRetry(() =>
    request.get(`${API}${path}`, { headers: { Authorization: `Bearer ${jwt}` } }),
  );
  expect(response.status(), `GET ${path}`).toBe(200);
  return (await response.json()) as T;
}

/** The first of the teacher's classes whose live diagnostic carries groups. */
async function groupedDiagnostic(request: APIRequestContext): Promise<DiagnosticPayload> {
  const jwt = await loginCached(request, API, TEACHER);
  const { classes } = await getJson<{ classes: Array<{ class_document_id: string }> }>(
    request,
    jwt,
    '/api/teacher/dashboard',
  );
  for (const { class_document_id: classId } of classes) {
    const { data } = await getJson<{ data: DiagnosticPayload }>(
      request,
      jwt,
      `/api/schools/me/classes/${classId}/diagnostic`,
    );
    if (data.groups.length > 0) return data;
  }
  throw new Error(`[e2e] none of ${TEACHER.email}'s classes has a grouped diagnostic`);
}

test.describe('task 99: group by limiting attribute vs live C-RPT-01 v2', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('API baseline: groups are coherent with the mastery rows and the catalog', async ({
    request,
  }) => {
    const diagnostic = await groupedDiagnostic(request);
    expect(diagnostic.groups.length).toBeGreaterThan(0);

    const masteryRefs = diagnostic.mastery.map((row) => row.student_ref);
    for (const group of diagnostic.groups) {
      // The wire count is the member count, every member is a real roster student,
      // and every limiting attribute has a friendly catalog label (cat throws on a
      // missing key, so an unknown attribute fails loud here).
      expect(group.count).toBe(group.student_refs.length);
      expect(group.count).toBeGreaterThan(0);
      const area =
        group.limiting_attribute === NOT_YET_ASSESSED
          ? NOT_YET_ASSESSED
          : diagnosticAreaCode(group.limiting_attribute);
      expect(area, `${group.limiting_attribute} has no reading area`).not.toBeNull();
      cat(en, `Teach.diagnostic.areas.${area}`);
      for (const ref of group.student_refs) {
        expect(masteryRefs).toContain(ref);
      }
    }
    // Every roster student lands in exactly the groups' membership (no one dropped
    // between mastery and groups).
    const grouped = diagnostic.groups.flatMap((group) => group.student_refs);
    expect(grouped.length).toBe(diagnostic.mastery.length);
  });
});
