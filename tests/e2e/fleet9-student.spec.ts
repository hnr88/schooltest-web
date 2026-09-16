import { expect, test } from '@playwright/test';

import { API_BASE_URL } from './helpers/mailpit';
import { roleCredentials } from './helpers/credentials';
import {
  f9stamp,
  loginJwt,
  MASK_SLOT,
  patientGoto,
  setAuth,
  shot,
  uiSignIn,
} from './fleet9-lib';

/**
 * F9 SLICE E — what student1@schooltest.local sees on the WEB, LIVE.
 *
 * The seeded student's renderer is a separate surface (the API CORS list names
 * :3010 for it — see auth-roles-smoke.spec.ts), so the honest expectation for
 * the web portal is "lands somewhere sane or a clean not-available state". This
 * spec screenshots whatever that is and refuses only actual breakage: crashes,
 * blank screens, or ANOTHER role's data.
 */

test.setTimeout(150_000);

test.describe.serial(() => {
  test('student signs in through the real form and lands somewhere sane', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await uiSignIn(
      page,
      roleCredentials('student').email,
      roleCredentials('student').password,
    );
    // The redirect settles on some authenticated page — any is fine but /sign-in.
    for (let attempt = 0; attempt < 10 && page.url().includes('/sign-in'); attempt += 1) {
      await page.waitForTimeout(1_000);
    }
    console.log('F9 student landed on:', page.url());
    expect(page.url()).not.toMatch(/sign-in/);
    await page.waitForTimeout(4_000);
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
    console.log('F9 student landing body:', body.slice(0, 300));
    // Sane = renders content, not a blank crash screen.
    expect(body.length, 'student landing must not be blank').toBeGreaterThan(20);
    await shot(page, '60-student-landing');
  });

  test('student deep-links: staff and parent surfaces all refuse', async ({ page }) => {
    // Fresh session as student (JWT via the API, exactly like a real sign-in).
    const jwt = await loginJwt(page.request, 'student');
    await setAuth(page, jwt);
    const routes = [
      ['/dashboard/children', '61-student-to-children'],
      ['/dashboard/school', '62-student-to-school'],
      ['/dashboard/school/students', '63-student-to-school-students'],
      ['/dashboard/teach', '64-student-to-teach'],
      ['/dashboard/teacher/results', '65-student-to-teacher-results'],
      ['/dashboard/ops/schools', '66-student-to-ops-schools'],
      ['/dashboard/notifications', '67-student-to-notifications'],
      ['/dashboard/test-sessions', '68-student-to-test-sessions'],
    ] as const;
    for (const [route, slug] of routes) {
      await patientGoto(page, route);
      // MEASURED (fleet9-debug-studentsettle.spec.ts): the section itself paints
      // its skeleton first, then the role gate redirects the student to
      // /dashboard — the URL change can lag several seconds under fleet load.
      for (let attempt = 0; attempt < 25; attempt += 1) {
        await page.waitForTimeout(1_000);
        if (!page.url().includes(route)) break;
      }
      await page.waitForTimeout(2_000);
      const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
      console.log(`F9 student → ${route}: settled ${page.url()} :: "${body.slice(0, 120)}"`);
      // Refusal = the URL no longer names the forbidden section, or a refusal
      // state rendered in place (mask / 404 card).
      const refused =
        !page.url().includes(route) ||
        body.includes('Not part of this release') ||
        body.includes('This page hopped away');
      expect(refused, `student deep-link ${route} must refuse, got ${page.url()}`).toBeTruthy();
      // And no staff/parent data may render (seeded rosters would be here).
      expect(body).not.toMatch(/Amara Baptiste|Keller|Ops console|Teacher dashboard/i);
      await shot(page, slug);
    }
  });

  test('student lands on a sane (if rough) dashboard: clean error state, never staff data', async ({
    page,
  }) => {
    // MEASURED (fleet9-debug-studentdash.spec.ts): /dashboard for a student
    // shows the roster skeleton for ~20s, then resolves to the honest error
    // card "Could not load your students…" (the /api/my/students read is
    // 403 for this role — retried 4x). Rough UX, but a CLEAN state: no crash,
    // no blank screen, no other family's data.
    const jwt = await loginJwt(page.request, 'student');
    await setAuth(page, jwt);
    await patientGoto(page, '/dashboard');
    const errorCard = page.getByText('Could not load your students');
    for (let attempt = 0; attempt < 45 && !(await errorCard.isVisible()); attempt += 1) {
      await page.waitForTimeout(1_000);
    }
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
    console.log('F9 student dashboard settled: "%s"', body.slice(0, 160));
    expect(body.length).toBeGreaterThan(20);
    expect(body).toMatch(/Could not load your students|Loading your students/);
    await shot(page, '69-student-dashboard-settled');
  });

  test('student write attempts against parent APIs are refused', async ({ request }) => {
    const stamp = f9stamp();
    const jwt = await loginJwt(request, 'student');
    const headers = { Authorization: `Bearer ${jwt}` };

    // C-STUDENT-CREATE is parent/ops only — a student create must be refused.
    const create = await request.post(`${API_BASE_URL}/api/students`, {
      headers,
      data: {
        data: {
          given_name: 'F9Student',
          family_name: stamp,
          email: `f9-student-${stamp.toLowerCase()}@example.com`,
          date_of_birth: '2014-01-15',
          gender: 'female',
          nationality: 'Australian',
          current_school: 'F9 Probe Primary',
          current_year_level: 'Year 7',
          year_level: 7,
          target_entry_year: '2027',
          target_entry_term: 'Term 1',
          parent_guardian_name: 'F9 Student Parent',
          parent_guardian_email: 'f9-student-guardian@example.com',
          parent_guardian_phone: '0400000000',
          preferred_contact_channel: 'email',
        },
      },
    });
    console.log('F9 student POST /api/students:', create.status());
    expect([401, 403, 404]).toContain(create.status());

    // The parent roster read is parent-scoped.
    const myStudents = await request.get(`${API_BASE_URL}/api/my/students`, { headers });
    console.log('F9 student GET /api/my/students:', myStudents.status());
    expect([401, 403, 404]).toContain(myStudents.status());
  });
});
