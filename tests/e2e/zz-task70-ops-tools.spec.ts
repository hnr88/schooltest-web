import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';

// Task 70 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-OPS-04: the three ops data surfaces. API level: the RDG-FT-A-79 inspection
// payload (items + locked flag), the responses.csv contract (400 on the wrong
// param, item-level rows on the right one) and the audited view-as-teacher
// read for verify21. UI level: the tools page drives the inspection picker
// and the view-as panel end to end. Finally a teacher is bounced off the page.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = { email: 'admin@schooltest.local', password: 'TBUaS2yS6D9FJMZP!A1' };
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
// Seeded fixtures: form RDG-FT-A-79, teacher verify21, a session with 53 responses.
const FORM_DOCUMENT_ID = 'v5ytx5ji0mkqps1vr7dmhrvi';
const TEACHER_DOCUMENT_ID = 'be0x1qfrblrirppvstnsa468';
const SESSION_DOCUMENT_ID = 'ymd2oc6zp5r3g2vdntey2agy';

async function login(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: email, password },
  });
  expect(res.ok()).toBeTruthy();
  const { jwt } = (await res.json()) as { jwt: string };
  return jwt;
}

async function signIn(page: Page, email: string, password: string, landing: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL(`**${landing}`, { timeout: 30_000 });
}

test.describe('task 70: ops data surfaces (C-OPS-04)', () => {
  test('API: inspection, responses.csv and view-as-teacher conform', async ({ request }) => {
    const jwt = await login(request, OPS.email, OPS.password);
    const auth = { Authorization: `Bearer ${jwt}` };

    const inspection = await request.get(
      `${API}/api/ops/forms/${FORM_DOCUMENT_ID}/inspection`,
      { headers: auth },
    );
    expect(inspection.ok()).toBeTruthy();
    const { data } = (await inspection.json()) as {
      data: {
        form_code: string;
        items: Array<{ item_code: string; stage: number; key: unknown }>;
        anchors: string[];
        locked: boolean;
      };
    };
    expect(data.form_code).toBe('RDG-FT-A-79');
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0].item_code).toBe('RDG-1A-001');
    expect(data.locked).toBe(true);

    const wrongParam = await request.get(
      `${API}/api/ops/responses.csv?session_document_id=${SESSION_DOCUMENT_ID}`,
      { headers: auth },
    );
    expect(wrongParam.status()).toBe(400);

    const csv = await request.get(
      `${API}/api/ops/responses.csv?session_documentId=${SESSION_DOCUMENT_ID}`,
      { headers: auth },
    );
    expect(csv.ok()).toBeTruthy();
    expect(csv.headers()['content-type']).toContain('text/csv');
    const lines = (await csv.text()).trim().split('\n');
    expect(lines[0]).toBe(
      'session_document_id,sequence_index,item_code,raw_response,presented_at,responded_at',
    );
    expect(lines.length - 1).toBe(53);

    const view = await request.get(`${API}/api/ops/view-as-teacher/${TEACHER_DOCUMENT_ID}`, {
      headers: auth,
    });
    expect(view.ok()).toBeTruthy();
    const viewData = (await view.json()) as {
      data: { classes: Array<{ name: string }>; sittings: unknown[]; monitors: unknown[] };
    };
    expect(viewData.data.classes.map((row) => row.name)).toEqual(['EAL/D Year 7 - Room 4']);
    expect(viewData.data.sittings.length).toBe(viewData.data.monitors.length);
  });

  test('tools page drives the inspection picker and the view-as panel', async ({ page }) => {
    await signIn(page, OPS.email, OPS.password, '/dashboard/ops/schools');
    await page.goto('/dashboard/ops/tools');

    const surface = page.locator('[data-surface="ops-tools"]');
    await expect(surface).toBeVisible({ timeout: 20_000 });

    const inspectionPanel = surface.locator('[data-surface="ops-form-inspection"]');
    await inspectionPanel
      .getByLabel(cat(en, 'Ops.tools.inspection.pickerLabel'), { exact: true })
      .click();
    await page.getByRole('option', { name: 'RDG-FT-A-79', exact: true }).click();
    await expect(
      inspectionPanel.locator('[data-surface="ops-form-inspection-locked"]'),
    ).toHaveText(cat(en, 'Ops.tools.inspection.locked'), { timeout: 20_000 });
    await expect(inspectionPanel.getByText('RDG-1A-001', { exact: true })).toBeVisible();

    const viewPanel = surface.locator('[data-surface="ops-view-as-teacher"]');
    await viewPanel
      .getByLabel(cat(en, 'Ops.tools.viewAs.schoolLabel'), { exact: true })
      .click();
    await page.getByRole('option', { name: 'SchoolTest Demo School A', exact: true }).click();
    await viewPanel
      .getByLabel(cat(en, 'Ops.tools.viewAs.teacherLabel'), { exact: true })
      .click();
    await page.getByRole('option', { name: /Vee Twentyone/ }).click();

    const viewData = viewPanel.locator('[data-surface="ops-view-as-teacher-data"]');
    await expect(viewData).toBeVisible({ timeout: 20_000 });
    await expect(
      viewData.getByText(icu(cat(en, 'Ops.tools.viewAs.banner'), { name: 'Vee Twentyone' })),
    ).toBeVisible();
    await expect(viewData.getByText('EAL/D Year 7 - Room 4', { exact: true }).first()).toBeVisible();
  });

  test('teacher is bounced out of /dashboard/ops/tools', async ({ page }) => {
    await signIn(page, TEACHER.email, TEACHER.password, '/dashboard/teach');
    await page.goto('/dashboard/ops/tools');
    await page.waitForURL('**/dashboard/teach', { timeout: 30_000 });
    await expect(page.locator('[data-surface="ops-tools"]')).toHaveCount(0);
  });
});
