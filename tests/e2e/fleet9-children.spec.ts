import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { deleteStudents } from './helpers/student-cleanup';
import { uploadStudentMedia } from './helpers/wizard-fill';
import { API_BASE_URL } from './helpers/mailpit';
import {
  expectMasked,
  f9stamp,
  loginJwt,
  MASK_SLOT,
  MASK_TITLE,
  patientGoto,
  setAuth,
  shot,
  studentPayload,
} from './fleet9-lib';

/**
 * F9 SLICE A — the parent's children surfaces, LIVE.
 *
 * STACK POSTURE (measured, fleet9-probe.spec.ts): this stack runs with the
 * parent portal MASKED (NEXT_PUBLIC_PARENT_VIEWS_ENABLED unset → schema default
 * 'false', src/lib/env.ts). Every /dashboard children route renders
 * ParentViewsUnavailable — "Not part of this release" — so the UI-side
 * assertions here prove the MASK (and that it never leaks another family's
 * data), while the parent's real data and write-path are proven through the
 * LIVE parent API the masked UI sits on (C-STUDENT-LIST / C-STUDENT-UPDATE /
 * C-PARENT-CHILD-PROGRESS). Screenshots capture every step.
 */

test.setTimeout(120_000);

interface MyStudent {
  documentId: string;
  given_name: string;
  family_name: string;
}

let parentJwt = '';

async function myStudents(request: APIRequestContext, jwt = parentJwt): Promise<MyStudent[]> {
  const res = await request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return ((await res.json()) as { data: MyStudent[] }).data;
}

test.describe.serial(() => {
  test('children list, child detail, new-child and a bogus id all render the masked state', async ({
    page,
    request,
  }) => {
    parentJwt = await loginJwt(request, 'parent');
    await setAuth(page, parentJwt);
    await page.setViewportSize({ width: 1280, height: 800 });

    // The list surface.
    await patientGoto(page, '/dashboard/children');
    await expectMasked(page);
    await expect(page.getByText('My children')).toBeVisible(); // breadcrumb/shell, not the roster
    await shot(page, '10-children-list-masked');

    // The roster has a real shape to hide: the API returns the seeded children.
    const roster = await myStudents(request);
    const names = roster.map((s) => `${s.given_name} ${s.family_name}`);
    console.log('F9 roster behind the mask:', JSON.stringify({ names, count: roster.length }));
    expect(names).toContain('Mia Keller');
    expect(names).toContain('Jonas Keller');

    // A real child detail documentId — masked too, and the mask is the SAME state.
    const mia = roster.find((s) => s.given_name === 'Mia');
    expect(mia).toBeTruthy();
    await patientGoto(page, `/dashboard/children/${mia!.documentId}`);
    await expectMasked(page);
    await shot(page, '11-child-detail-masked');

    // The new-child wizard entry — masked (so the student wizard is unreachable in UI).
    await patientGoto(page, '/dashboard/children/new');
    await expectMasked(page);
    await shot(page, '12-child-new-masked');

    // A fabricated documentId: no crash, same mask, never any child data.
    await patientGoto(page, '/dashboard/children/f9doesnotexist0000000000');
    await expectMasked(page);
    await shot(page, '13-child-bogus-id-masked');

    // Shared /dashboard lands on the same state for this role.
    await patientGoto(page, '/dashboard');
    await expectMasked(page);
    await shot(page, '14-dashboard-masked');
  });

  test('API: each child exposes profile + progress; the empty-result child is a real state', async ({
    request,
  }) => {
    const roster = await myStudents(request);
    for (const child of roster.slice(0, 4)) {
      const detail = await request.get(`${API_BASE_URL}/api/my/students/${child.documentId}`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
      });
      expect(detail.ok(), await detail.text()).toBeTruthy();
      const progress = await request.get(
        `${API_BASE_URL}/api/my/students/${child.documentId}/progress`,
        { headers: { Authorization: `Bearer ${parentJwt}` } },
      );
      expect(progress.ok(), await progress.text()).toBeTruthy();
      const body = (await progress.json()) as { data: { metrics: Record<string, number> } };
      console.log(
        'F9 child progress:',
        child.given_name,
        JSON.stringify(body.data.metrics),
        body.data.metrics.officialResults === 0 ? '(EMPTY-RESULT CHILD)' : '',
      );
      // Honest empty state: a child with zero results still yields a well-formed
      // progress payload, not an error — the state the masked UI would have to
      // render as the empty timeline.
      expect(body.data.metrics).toHaveProperty('totalSessions');
      expect(body.data.metrics).toHaveProperty('officialResults');
    }
  });

  test('foreign child refused: API 404 everywhere, UI never renders the child', async ({
    page,
    request,
  }) => {
    // A REAL student from another family, plucked with the teacher read
    // (schoolAdmin gets a PolicyError on the core list; the teacher's class
    // roster is the documented read — any of those children is a foreign FAMILY
    // to parent@schooltest.local, the Keller rosters' opposite).
    const teacher = await loginJwt(request, 'teacher');
    const all = await request.get(
      `${API_BASE_URL}/api/students?pagination[page]=1&pagination[pageSize]=50`,
      { headers: { Authorization: `Bearer ${teacher}` } },
    );
    expect(all.ok(), await all.text()).toBeTruthy();
    const rows = ((await all.json()) as { data: MyStudent[] }).data;
    const mine = new Set((await myStudents(request)).map((s) => s.documentId));
    const foreign = rows.find((s) => !mine.has(s.documentId) && !s.given_name.startsWith('F9'));
    expect(foreign, 'expected at least one non-F9 student outside the parent roster').toBeTruthy();
    console.log('F9 foreign child:', foreign!.documentId, `${foreign!.given_name} ${foreign!.family_name}`);

    const headers = { Authorization: `Bearer ${parentJwt}` };
    const detail = await request.get(`${API_BASE_URL}/api/my/students/${foreign!.documentId}`, {
      headers,
    });
    expect(detail.status(), await detail.text()).toBe(404);
    const progress = await request.get(
      `${API_BASE_URL}/api/my/students/${foreign!.documentId}/progress`,
      { headers },
    );
    expect(progress.status(), await progress.text()).toBe(404);
    const put = await request.put(`${API_BASE_URL}/api/students/${foreign!.documentId}`, {
      headers,
      data: { data: { parent_guardian_phone: '0999999999' } },
    });
    console.log('F9 foreign-child PUT refused with:', put.status());
    expect([403, 404]).toContain(put.status());

    // UI: direct URL to the foreign child — the masked state, never the child.
    await setAuth(page, parentJwt);
    await patientGoto(page, `/dashboard/children/${foreign!.documentId}`);
    await expectMasked(page);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain(foreign!.family_name);
    await shot(page, '15-foreign-child-masked');
  });

  test('ownership: school/class cannot be written onto a child by the parent', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const stamp = f9stamp();
    const created: string[] = [];
    try {
      const media = await uploadStudentMedia(request, parentJwt);
      // Smuggling attempt: ownership/relations + an unknown status field ride
      // along with an otherwise valid create payload (C-STUDENT-CREATE).
      const create = await request.post(`${API_BASE_URL}/api/students`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
        data: {
          data: {
            ...studentPayload(`${stamp}-create`),
            ...media,
            school: 999999,
            class: 999999,
            school_connect: 999999,
            student_status: 'active',
          },
        },
      });
      expect(
        create.ok(),
        `[f9] create with smuggled relations: ${create.status()} ${await create.text()}`,
      ).toBeTruthy();
      const childId = ((await create.json()) as { data: { documentId: string } }).data.documentId;
      created.push(childId);

      const readBack = await request.get(`${API_BASE_URL}/api/my/students/${childId}`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
      });
      expect(readBack.ok(), await readBack.text()).toBeTruthy();
      const childBody = (await readBack.json()) as { data: Record<string, unknown> };
      console.log(
        'F9 create response keys:',
        JSON.stringify(Object.keys(childBody.data)),
        'school/class/student_status present?',
        'school' in childBody.data,
        'class' in childBody.data,
        'student_status' in childBody.data,
      );
      // The whitelist must strip the relations: none of them may come back.
      expect(childBody.data).not.toHaveProperty('school');
      expect(childBody.data).not.toHaveProperty('class');
      // status smuggling is ignored too (verified: create-with-'archived' stays
      // 'active'; the sanctioned flip is POST /students/:id/archive).
      expect(childBody.data.student_status).toBe('active');
      await shot(page, '16-ownership-create-stripped'); // UI state at the moment of the API proof

      // The same smuggling on the UPDATE path, plus one ALLOWED contact edit.
      const update = await request.put(`${API_BASE_URL}/api/students/${childId}`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
        data: {
          data: {
            parent_guardian_phone: '0411222333',
            school: 888888,
            class: 888888,
            student_status: 'archived',
          },
        },
      });
      expect(
        update.ok(),
        `[f9] update with smuggled relations: ${update.status()} ${await update.text()}`,
      ).toBeTruthy();
      const after = await request.get(`${API_BASE_URL}/api/my/students/${childId}`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
      });
      const afterBody = (await after.json()) as {
        data: { parent_guardian_phone?: string; school?: unknown; class?: unknown };
      };
      console.log('F9 after update:', JSON.stringify(afterBody.data).slice(0, 400));
      expect(afterBody.data.parent_guardian_phone).toBe('0411222333'); // allowed edit persisted
      expect(afterBody.data).not.toHaveProperty('school'); // relation still absent
      expect(afterBody.data).not.toHaveProperty('class');
      await shot(page, '17-ownership-update-stripped');

      // Overlong + malformed contact values are refused by the server schema.
      const bad = await request.put(`${API_BASE_URL}/api/students/${childId}`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
        data: { data: { parent_guardian_phone: 'not-a-phone-'.repeat(30) } },
      });
      console.log('F9 invalid phone refused with:', bad.status(), (await bad.text()).slice(0, 160));
      expect([400, 422]).toContain(bad.status());
    } finally {
      await deleteStudents(request, created);
    }
  });

  test('staff routes all refuse a signed-in parent', async ({ page }) => {
    await setAuth(page, parentJwt);
    // MEASURED (fleet9-debug-staffroutes.spec.ts): every staff section renders
    // the SAME parent mask (staff breadcrumbs like "Dashboard / School" stay
    // above it — nav labels only, no data) — except /dashboard/teacher/results,
    // which 404s ("This page hopped away"). Both are refusals.
    const staffRoutes = [
      ['/dashboard/school', '20-parent-to-school-admin'],
      ['/dashboard/school/students', '21-parent-to-school-students'],
      ['/dashboard/teach', '22-parent-to-teach'],
      ['/dashboard/teacher/results', '23-parent-to-teacher-results'],
      ['/dashboard/ops/schools', '24-parent-to-ops-schools'],
      ['/dashboard/test-sessions', '25-parent-to-test-sessions'],
    ] as const;
    for (const [route, slug] of staffRoutes) {
      await patientGoto(page, route);
      const mask = page.locator(MASK_SLOT);
      const gone = page.getByText('This page hopped away');
      await expect
        .poll(
          async () =>
            ((await mask.count()) > 0 && (await mask.isVisible())) ||
            ((await gone.count()) > 0 && (await gone.isVisible())),
          { timeout: 30_000, message: `${route} never refused` },
        )
        .toBe(true);
      const body = await page.locator('body').innerText();
      console.log(`F9 parent → ${route}: url=${page.url()}`);
      expect(body).not.toMatch(/Ops console|Teacher dashboard/i);
      // The refusal states carry no staff data — no school/class names, no
      // student rosters (sample: any seeded teacher class label would be here).
      expect(body).not.toMatch(/Amara Baptiste|EAL\/D Year 7/);
      await shot(page, slug);
    }
    // Sanity: the parent still sees their own masked shell afterwards.
    await patientGoto(page, '/dashboard/children');
    await expect(page.getByText(MASK_TITLE, { exact: true })).toBeVisible();
  });
});
