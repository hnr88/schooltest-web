import { expect, test } from '@playwright/test';

import {
  ACARA_PHASES,
  API,
  apiClassDetail,
  apiClassStudent,
  FIXTURE_CLASS_ID,
  schoolAdminJwt,
  studentWithEvidence,
} from './helpers/class-detail';
import { loginCached } from './helpers/http';
import { ROLE_CREDENTIALS } from './helpers/roles';

// C-CLS-05 / C-CLS-06 wire contract, asserted against the RUNNING API — not
// "a 2xx came back". Both bodies are parsed with the app's OWN shared Zod
// schemas (in the helper), so a shape drift fails here first.
const SUBSKILLS = ['decoding', 'vocabulary', 'grammar', 'gist', 'detail', 'inference', 'critical'];
const UNKNOWN_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';

test.describe('C-CLS-05 / C-CLS-06 contract', () => {
  test('flow 18: the class detail body satisfies every contracted invariant', async ({ request }) => {
    const detail = await apiClassDetail(request, await schoolAdminJwt(request));

    expect(detail.student_count).toBe(detail.students.length);
    expect(detail.summary.students).toBe(detail.students.length);

    let testACompleted = 0;
    let testBCompleted = 0;
    for (const student of detail.students) {
      // Always exactly [A, B], in that order.
      expect(student.tests.map((test) => test.test_id)).toEqual(['A', 'B']);
      for (const test of student.tests) {
        if (test.status !== 'completed') {
          expect(test.overall_score, `${student.documentId} ${test.test_id} score`).toBeNull();
          expect(test.acara_phase, `${student.documentId} ${test.test_id} phase`).toBeNull();
          expect(test.subskills, `${student.documentId} ${test.test_id} subskills`).toBeNull();
          continue;
        }
        if (test.test_id === 'A') testACompleted += 1;
        else testBCompleted += 1;
        if (test.overall_score !== null) {
          expect(Number.isInteger(test.overall_score)).toBe(true);
          expect(test.overall_score).toBeGreaterThanOrEqual(0);
          expect(test.overall_score).toBeLessThanOrEqual(100);
        }
        if (test.acara_phase !== null) {
          expect(ACARA_PHASES as readonly string[]).toContain(test.acara_phase);
          expect(test.acara_phase).not.toMatch(/Phase\s*\d/);
        }
        if (test.subskills !== null) {
          expect(Object.keys(test.subskills)).toEqual(SUBSKILLS);
          for (const verdict of Object.values(test.subskills)) {
            expect(['mastered', 'not_yet']).toContain(verdict);
          }
        }
      }
    }
    expect(detail.summary.test_a_completed).toBe(testACompleted);
    expect(detail.summary.test_b_completed).toBe(testBCompleted);

    // The null-tolerant checks above would all pass against a server that
    // returned nothing but nulls, so require the evidence to actually be there:
    // at least one completed test carrying a score, a phase AND seven verdicts,
    // and a summary average derived from them.
    const evidenced = detail.students
      .flatMap((student) => student.tests)
      .filter(
        (test) =>
          test.status === 'completed' &&
          test.overall_score !== null &&
          test.acara_phase !== null &&
          test.subskills !== null,
      );
    expect(evidenced.length, 'no completed test carries evidence').toBeGreaterThan(0);
    expect(detail.summary.avg_reading_score).not.toBeNull();
  });

  test('flow 19: the drill-down agrees with the class row, field for field', async ({ request }) => {
    const jwt = await schoolAdminJwt(request);
    const detail = await apiClassDetail(request, jwt);
    const target = studentWithEvidence(detail, 'A');
    expect(target, 'run the fixture seed first').toBeTruthy();

    const student = await apiClassStudent(request, jwt, target!.documentId);
    expect(student.documentId).toBe(target!.documentId);
    expect(student.class.documentId).toBe(detail.documentId);
    // The SAME per-student derivation feeds both endpoints.
    expect(student.tests).toEqual(target!.tests);
  });

  test('flow 20: Test A/B completion agrees with the C-RPT-04 participation monitor', async ({
    request,
  }) => {
    const jwt = await schoolAdminJwt(request);
    const detail = await apiClassDetail(request, jwt);

    const res = await request.get(`${API}/api/schools/me/participation`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      data: {
        classes: Array<{
          documentId: string;
          roster_count: number;
          test_a: { submitted: number };
          test_b: { submitted: number };
        }>;
      };
    };
    const monitored = body.data.classes.find((row) => row.documentId === FIXTURE_CLASS_ID);
    expect(monitored, 'the fixture class must appear in the participation monitor').toBeTruthy();

    expect(detail.summary.students).toBe(monitored!.roster_count);
    expect(detail.summary.test_a_completed).toBe(monitored!.test_a.submitted);
    expect(detail.summary.test_b_completed).toBe(monitored!.test_b.submitted);
  });

  test('flow 21: every refusal path returns the contracted status', async ({ request }) => {
    const jwt = await schoolAdminJwt(request);
    const opsJwt = await loginCached(request, API, {
      email: ROLE_CREDENTIALS.ops.email,
      password: ROLE_CREDENTIALS.ops.password,
    });
    const detail = await apiClassDetail(request, jwt);
    const student = detail.students[0];
    const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

    // No token: users-permissions evaluates the PUBLIC role, which holds no grant.
    expect((await request.get(`${API}/api/schools/me/classes/${FIXTURE_CLASS_ID}`)).status()).toBe(403);
    // Forged bearer.
    expect(
      (
        await request.get(`${API}/api/schools/me/classes/${FIXTURE_CLASS_ID}`, {
          headers: { Authorization: 'Bearer not.a.jwt' },
        })
      ).status(),
    ).toBe(401);
    // Wrong role.
    expect(
      (await request.get(`${API}/api/schools/me/classes/${FIXTURE_CLASS_ID}`, auth(opsJwt))).status(),
    ).toBe(403);
    // Unknown class.
    expect((await request.get(`${API}/api/schools/me/classes/${UNKNOWN_ID}`, auth(jwt))).status()).toBe(404);
    // Unknown student inside a real class.
    expect(
      (
        await request.get(
          `${API}/api/schools/me/classes/${FIXTURE_CLASS_ID}/students/${UNKNOWN_ID}`,
          auth(jwt),
        )
      ).status(),
    ).toBe(404);
    // A real student, but through a class they are not in.
    const otherClass = (
      await request.get(`${API}/api/schools/me/classes`, auth(jwt))
    ).json() as Promise<{ data: Array<{ documentId: string }> }>;
    const foreign = (await otherClass).data.find((row) => row.documentId !== FIXTURE_CLASS_ID);
    expect(foreign, 'need a second class in this school').toBeTruthy();
    expect(
      (
        await request.get(
          `${API}/api/schools/me/classes/${foreign!.documentId}/students/${student.documentId}`,
          auth(jwt),
        )
      ).status(),
    ).toBe(404);
  });
});
