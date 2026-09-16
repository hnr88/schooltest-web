/**
 * F3 — the import HAPPY path in the real browser, on the live demo school:
 *
 *   small csv of valid unique @invalid emails -> pick class -> AUTO-PREVIEW
 *   (no preview click exists any more) -> ready card with counts -> commit ->
 *   result summary -> UNDO inside the window -> counts back.
 *
 * Every card state is screenshotted into tests/e2e/captures/fleet3/, seat and
 * student counts are cross-checked through the live API before/after, and the
 * commit request is counted (exactly one).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  CAPTURES,
  PORTAL_HEADER,
  apiJwt,
  entitlement,
  f3Stamp,
  liveDemoSchoolId,
  openImportModal,
  pickClass,
  portalRow,
  schoolDetail,
  trackRequests,
} from './fleet3-helpers';

const CLASS_NAME = 'EAL/D Year 7 - Room 4';

test.describe('F3 import happy path: auto-preview -> ready -> commit -> undo', () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(120_000);

  test('commits two students, shows the result, and undoes inside the window', async ({
    page,
    request,
  }, testInfo) => {
    const stamp = f3Stamp();
    const schoolId = await liveDemoSchoolId();
    const jwt = await apiJwt(request);

    const alpha = `f3.happy.alpha.${stamp}@import.invalid`;
    const beta = `f3.happy.beta.${stamp}@import.invalid`;
    const csv = [PORTAL_HEADER, portalRow('F3', `Alpha ${stamp}`, alpha), portalRow('F3', `Beta ${stamp}`, beta)].join('\n');

    // Counts BEFORE, straight from the live API.
    const detailBefore = await schoolDetail(request, jwt, schoolId);
    const seatsBefore = await entitlement(request, jwt, schoolId);

    await signInAsOps(page);
    const panel = await openImportModal(page, schoolId);
    await mkdir(CAPTURES, { recursive: true });

    // No preview click exists: dropping the file arms the auto-preview, which
    // fires the moment the class is picked. Count the requests — exactly ONE.
    const previews = trackRequests(page, '/import-students/preview');
    const commits = trackRequests(page, '/import-students/commit');

    await panel
      .locator('#ops-import-file')
      .setInputFiles({ name: `f3-happy-${stamp}.csv`, mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await pickClass(page, CLASS_NAME);

    const card = page.locator('[data-surface="ops-student-import"]');
    const previewSurface = panel.locator('[data-surface="ops-import-preview"]');

    // Auto-preview: ONE request, no click, ready card.
    await expect(previewSurface).toBeVisible({ timeout: 30_000 });
    await expect(card).toHaveAttribute('data-card', 'ready', { timeout: 30_000 });
    expect(previews.count(), 'auto-preview fires exactly once').toBe(1);
    await expect(
      previewSurface.getByText('2 students will be created, 0 already exist, 0 rows need fixing', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(previewSurface.getByText(alpha, { exact: true })).toBeVisible();
    await expect(previewSurface.getByText(beta, { exact: true })).toBeVisible();

    const cta = panel.locator('[data-surface="ops-import-cta"]');
    await expect(cta).toContainText('Import 2 students');
    await panel.screenshot({ path: path.join(CAPTURES, '03-card-ready.png') });
    console.log('CAPTURE', path.join(CAPTURES, '03-card-ready.png'));

    // COMMIT — one click, one POST.
    await cta.click();

    // Result summary + Undo button inside the 60s window.
    const result = panel.locator('[data-surface="ops-import-result"]');
    await expect(result).toBeVisible({ timeout: 30_000 });
    await expect(result).toContainText('Import finished. Created: 2. Already existed: 0. Rejected: 0.');
    expect(commits.count(), 'exactly ONE commit POST').toBe(1);
    const undo = result.getByRole('button', { name: 'Undo import', exact: true });
    await expect(undo).toBeVisible({ timeout: 15_000 });
    await panel.screenshot({ path: path.join(CAPTURES, '04-result-undo-window.png') });
    console.log('CAPTURE', path.join(CAPTURES, '04-result-undo-window.png'));

    // Cross-check THROUGH THE API: two more students, two more seats used.
    const detailAfter = await schoolDetail(request, jwt, schoolId);
    expect(detailAfter.student_count).toBe(detailBefore.student_count + 2);
    const seatsAfter = await entitlement(request, jwt, schoolId);
    expect(seatsAfter.seats_used).toBe(seatsBefore.seats_used + 2);
    const roster = await request.get(
      `http://127.0.0.1:5500/api/ops/schools/${schoolId}/students?pageSize=200&q=${alpha}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(roster.ok()).toBeTruthy();
    const rosterBody = (await roster.json()) as { meta: { pagination: { total: number } } };
    expect(rosterBody.meta.pagination.total).toBe(1);

    // UNDO inside the window: students leave, counts return.
    await undo.click();
    await expect(result).toBeHidden({ timeout: 30_000 });
    await panel.screenshot({ path: path.join(CAPTURES, '05-after-undo.png') });
    console.log('CAPTURE', path.join(CAPTURES, '05-after-undo.png'));

    const detailUndone = await schoolDetail(request, jwt, schoolId);
    expect(detailUndone.student_count).toBe(detailBefore.student_count);
    const seatsUndone = await entitlement(request, jwt, schoolId);
    expect(seatsUndone.seats_used).toBe(seatsBefore.seats_used);
    console.log(
      'HAPPY-PATH OK', stamp,
      'preview-requests', previews.count(),
      'commit-requests', commits.count(),
    );
    await testInfo.attach('f3-happy-csv.txt', { body: csv, contentType: 'text/plain' });
  });

  test('no preview click exists anywhere in the modal (the design auto-validates)', async ({
    page,
  }) => {
    const schoolId = await liveDemoSchoolId();
    await signInAsOps(page);
    const panel = await openImportModal(page, schoolId);
    await expect(panel.getByRole('button', { name: 'Preview import', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Import students', exact: true })).toBeVisible();
  });
});
