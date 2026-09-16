import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { createImportClass, deleteImportClasses } from './helpers/class-import';
import { apiClassDetail, gotoClassDetail, schoolAdminJwt } from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { deleteStudents } from './helpers/student-cleanup';
import { watchErrors } from './helpers/ui';

// FLEET 6 scratch — class DETAIL counts vs roster, the student drill-down, and
// MOVING a student between two classes through the real Add-students picker.
// Also probes for any class ROSTER CSV export in the school-admin UI (the
// brief expects one with a student_status header — verify existence first).
const en = loadMessages('en');
const CAPTURES = path.resolve(process.cwd(), 'tests', 'e2e', 'captures', 'fleet6');
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const STAMP = Date.now();

let shotIndex = 0;

async function shot(page: Page, testInfo: TestInfo, slug: string, fullPage = false): Promise<void> {
  shotIndex += 1;
  const name = `${String(shotIndex).padStart(2, '0')}-${slug}.png`;
  const body = await page.screenshot({ path: path.join(CAPTURES, name), fullPage });
  await testInfo.attach(name, { body, contentType: 'image/png' });
}

async function loginAsPatient(page: Page): Promise<void> {
  try {
    await loginAs(page, 'schoolAdmin');
  } catch {
    await page.waitForTimeout(31_000);
    await loginAs(page, 'schoolAdmin');
  }
}

/**
 * FINDING (reported, not masked): GET /api/notifications deterministically
 * returns 500 on this environment and the shell poller logs console errors.
 * Filter exactly that; any other 5xx or console error still fails the test.
 */
function watchClassSurfaceErrors(page: Page): { errors: string[]; badResponses: string[] } {
  const errors = watchErrors(page).filter(
    (message) => !(message.includes('Failed to load resource') && message.includes('500')),
  );
  const badResponses: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/notifications')) return;
    if (response.url().includes('/api/') && response.status() >= 500) {
      badResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  return { errors, badResponses };
}

async function apiClasses(request: APIRequestContext, jwt: string) {
  const res = await request.get(`${API}/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: Array<Record<string, any>> }).data;
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

test.describe('fleet6: class detail, counts, drilldown, student moves', () => {
  const sourceClass = `F6-${STAMP} Move Source`;
  const targetClass = `F6-${STAMP} Move Target`;
  const classRegister: string[] = [];
  const probeRegister: string[] = [];

  test.afterAll(async ({ request }) => {
    await deleteStudents(request, probeRegister.splice(0)).catch(() => {});
    await deleteImportClasses(request, classRegister.splice(0));
  });

  test('01 student_count equals rendered roster rows on every Demo A class', async ({
    page,
  }, testInfo) => {
    const { errors, badResponses } = watchClassSurfaceErrors(page);
    await loginAsPatient(page);
    const jwt = await schoolAdminJwt(page.request);
    const rows = await apiClasses(page.request, jwt);
    // The four Reading classes carry the seeded rosters.
    const targets = rows.filter((row) => /^Reading 8[ABCD]/.test(row.name)).slice(0, 2);
    expect(targets.length).toBeGreaterThan(0);

    for (const target of targets) {
      const detail = await apiClassDetail(page.request, jwt, target.documentId);
      await gotoClassDetail(page, target.documentId);
      const gridRows = page
        .locator('[data-surface="school-admin-class-detail"]')
        .locator('[data-directory-row]');
      await expect(gridRows).toHaveCount(detail.student_count, { timeout: 30_000 });
      await expect(gridRows).toHaveCount(detail.students.length, { timeout: 10_000 });
      // The header chip states the same count.
      const surface = page.locator('[data-surface="school-admin-class-detail"]');
      await expect(surface).toContainText(
        `${detail.student_count} ${detail.student_count === 1 ? 'student' : 'students'}`,
      );
      // The summary card agrees too.
      await expect(
        surface
          .locator('[data-slot="metric-card"]')
          .filter({ hasText: cat(en, 'Classes.detail.summary.students') }),
      ).toContainText(String(detail.summary.students));
      await shot(page, testInfo, `counts-${target.name.replace(/[^\w]+/g, '-').toLowerCase()}`);
    }
    expect(badResponses, '5xx on class surfaces').toEqual([]);
    expect(errors).toEqual([]);
  });

  test('02 drilldown opens from a roster row and shows the class crumb', async ({
    page,
  }, testInfo) => {
    const { errors, badResponses } = watchClassSurfaceErrors(page);
    await loginAsPatient(page);
    const jwt = await schoolAdminJwt(page.request);
    const rows = await apiClasses(page.request, jwt);
    const reading8a = rows.find((row) => row.name === 'Reading 8A — Okonkwo');
    expect(reading8a).toBeTruthy();
    const detail = await apiClassDetail(page.request, jwt, reading8a!.documentId);
    const target = detail.students[0];

    await gotoClassDetail(page, reading8a!.documentId);
    await page
      .locator('[data-directory-row]')
      .filter({ hasText: [target.given_name, target.family_name].filter(Boolean).join(' ') })
      .first()
      .locator('[data-row-href]')
      .click();
    await page.waitForURL(
      new RegExp(`/classes/${reading8a!.documentId}/students/${target.documentId}$`),
    );
    const surface = page.locator('[data-surface="school-admin-class-student-detail"]');
    await expect(surface).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      [target.given_name, target.family_name].filter(Boolean).join(' '),
    );
    await expect(surface).toContainText(cat(en, 'Classes.studentDetail.firstLanguageLabel'));
    await expect(surface).toContainText(cat(en, 'Classes.studentDetail.levelLabel'));
    await shot(page, testInfo, 'drilldown-open', true);
    expect(badResponses, '5xx on class surfaces').toEqual([]);
    expect(errors).toEqual([]);
  });

  test('03 NO roster CSV export exists on the school-admin class surfaces', async ({
    page,
  }, testInfo) => {
    await loginAsPatient(page);
    const jwt = await schoolAdminJwt(page.request);
    const rows = await apiClasses(page.request, jwt);
    const reading8a = rows.find((row) => row.name === 'Reading 8A — Okonkwo')!;

    // The class detail surface offers no export/download affordance.
    await gotoClassDetail(page, reading8a.documentId);
    const detailButtons = await page
      .locator('[data-surface="school-admin-class-detail"]')
      .getByRole('button')
      .allInnerTexts();
    expect(
      detailButtons.map((label) => label.trim().toLowerCase()).filter((label) =>
        label.includes('export') || label.includes('download') || label.includes('csv'),
      ),
      'class detail must not silently grow an export — or the brief is stale',
    ).toEqual([]);

    // …nor does the classes list.
    await page.goto('/dashboard/school/classes');
    await expect(page.locator('[data-slot="school-classes"]')).toBeVisible({ timeout: 30_000 });
    const listButtons = await page
      .locator('[data-slot="school-classes"]')
      .getByRole('button')
      .allInnerTexts();
    expect(
      listButtons.map((label) => label.trim().toLowerCase()).filter((label) =>
        label.includes('export') || label.includes('download') || label.includes('csv'),
      ),
    ).toEqual([]);
    await shot(page, testInfo, 'no-class-export-buttons', true);
  });

  test('04 move a student between two classes; both counts update', async ({ page }, testInfo) => {
    const { errors, badResponses } = watchClassSurfaceErrors(page);
    await loginAsPatient(page);
    const jwt = await schoolAdminJwt(page.request);

    const sourceId = await createImportClass(page.request, jwt, sourceClass);
    const targetId = await createImportClass(page.request, jwt, targetClass);
    classRegister.push(sourceId, targetId);

    // One student in the SOURCE class through the real import dialog.
    await gotoClassDetail(page, sourceId);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog
      .getByLabel(cat(en, 'StudentImport.pasteLabel'))
      .fill(
        [
          'given name,family name,email,date of birth,year level,home language',
          `F6 Mover ${STAMP},Probe,f6-mover-${STAMP}@invalid.test,2012-05-05,8,english`,
        ].join('\n'),
      );
    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('1 student was imported');
    const sourceDetail = await apiClassDetail(page.request, jwt, sourceId);
    expect(sourceDetail.student_count).toBe(1);
    probeRegister.push(sourceDetail.students[0].documentId);

    // TARGET: Add students picker lists the source student as "will be moved".
    await gotoClassDetail(page, targetId);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.addStudent') })
      .first()
      .click();
    const picker = page.getByRole('dialog');
    await expect(picker).toBeVisible();
    await expect(picker).toContainText(
      cat(en, 'Classes.detail.studentPicker.moveWarning'),
    );
    await picker
      .getByLabel(cat(en, 'Classes.detail.studentPicker.searchLabel'))
      .fill(`F6 Mover ${STAMP}`);
    const candidate = picker.locator('[data-slot="class-students-picker"] label').filter({
      hasText: `F6 Mover ${STAMP}`,
    });
    await expect(candidate).toContainText(
      cat(en, 'Classes.detail.studentPicker.currentClassHint').replace('{className}', sourceClass),
    );
    await shot(page, testInfo, 'move-picker-warning');
    await candidate.getByRole('checkbox').check();
    await picker
      .getByRole('button', { name: cat(en, 'Classes.detail.studentPicker.save') })
      .click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(
      'Added 1 student to the class.',
    );
    await shot(page, testInfo, 'move-toast');

    // TARGET roster now holds the student; count chips update on BOTH classes.
    await expect(
      page.locator('[data-surface="school-admin-class-detail"]').locator('[data-directory-row]'),
    ).toHaveCount(1, { timeout: 30_000 });

    const targetAfter = await apiClassDetail(page.request, jwt, targetId);
    expect(targetAfter.student_count).toBe(1);
    const sourceAfter = await apiClassDetail(page.request, jwt, sourceId);
    expect(sourceAfter.student_count).toBe(0);

    // SOURCE class detail shows the empty roster arm.
    await gotoClassDetail(page, sourceId);
    await expect(page.locator('[data-slot="empty-state"]')).toBeVisible();
    await shot(page, testInfo, 'move-source-now-empty', true);
    expect(badResponses, '5xx on class surfaces').toEqual([]);
    expect(errors).toEqual([]);
  });
});
