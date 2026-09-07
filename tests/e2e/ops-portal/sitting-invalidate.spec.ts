/**
 * OPS-073 (web) — C-OPS-PORTAL-063 driven through the REAL ops portal against
 * the REAL Strapi. Nothing about the operation is simulated: a live sitting is
 * opened over HTTP, ops voids it from the school-detail recovery panel, and the
 * outcome is read back through a second authorized API request AND across a
 * page reload — a toast is not proof that anything persisted.
 *
 * Two Playwright traps this spec is written around:
 *  1. an unbounded wait on a hidden element hangs forever instead of failing, so
 *     every interaction carries an explicit timeout;
 *  2. the sign-in POST can be rate-limited, so the wait is for the SETTLED ops
 *     landing rather than the transient /dashboard hop.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { cat, loadMessages } from '../helpers/i18n';
import {
  ACTION_TIMEOUT,
  deleteSitting,
  invalidateButton,
  openSitting,
  opsJwt,
  readSittingStatus,
  resolveTargets,
  selectSitting,
  signInAsOps,
  teacherJwt,
} from '../helpers/ops-sitting-invalidate';

const en = loadMessages('en');
const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

test.describe('ops sitting recovery — invalidate (C-OPS-PORTAL-063)', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  let schoolDocumentId = '';
  let ops = '';
  let flow = { documentId: '', code: '' };
  let visual = { documentId: '', code: '' };

  test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
    // The arrangement rides out a shared rate-limit window and a dev-server
    // reload, both of which outlast the default hook budget.
    test.setTimeout(300_000);
    mkdirSync(CAPTURES, { recursive: true });
    ops = await opsJwt(request);
    const teacher = await teacherJwt(request);
    const targets = await resolveTargets(request, ops);
    schoolDocumentId = targets.schoolDocumentId;
    flow = await openSitting(request, teacher, targets.classDocumentId);
    visual = await openSitting(request, teacher, targets.classDocumentId);
  });

  test.afterAll(async ({ request }: { request: APIRequestContext }) => {
    for (const sitting of [flow, visual]) {
      if (sitting.documentId) await deleteSitting(request, ops, sitting.documentId);
    }
  });

  test('voids a live sitting from the school detail, and the void survives a reload', async ({
    page,
    request,
  }) => {
    await signInAsOps(page);
    const { detail } = await selectSitting(page, schoolDocumentId, flow.code);

    // The roster the panel is voiding — the live C-SIT-02 board.
    await expect(detail.getByRole('row').nth(1)).toBeVisible({ timeout: ACTION_TIMEOUT });

    // The confirmation dialog is a real gate: Cancel changes nothing.
    await invalidateButton(detail).click({ timeout: ACTION_TIMEOUT });
    await expect(page.getByText(cat(en, 'Ops.recovery.confirmBody'), { exact: true })).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await page
      .getByRole('button', { name: cat(en, 'Ops.recovery.cancel'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });
    expect(await readSittingStatus(request, ops, flow.documentId)).toBe('open');

    await invalidateButton(detail).click({ timeout: ACTION_TIMEOUT });
    await page
      .getByRole('button', { name: cat(en, 'Ops.recovery.confirm'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });

    await expect(detail.locator('[data-surface="ops-sitting-invalidated"]')).toHaveText(
      cat(en, 'Ops.recovery.invalidatedNotice'),
      { timeout: ACTION_TIMEOUT },
    );
    await expect(page.getByText(cat(en, 'Ops.recovery.invalidatedToast'))).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await expect(invalidateButton(detail)).toBeDisabled({ timeout: ACTION_TIMEOUT });

    // Read back through the API, then through a fresh page load: the closed
    // sitting is what the server holds, not what this tab remembers.
    expect(await readSittingStatus(request, ops, flow.documentId)).toBe('closed');
    const reloaded = await selectSitting(page, schoolDocumentId, flow.code);
    await expect(invalidateButton(reloaded.detail)).toBeDisabled({ timeout: ACTION_TIMEOUT });
    await expect(
      reloaded.detail.locator('[data-surface="ops-sitting-invalidated"]'),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('captures the recovery panel at the reference viewport, at 375px and at 200%', async ({
    page,
  }) => {
    await signInAsOps(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const { panel, detail } = await selectSitting(page, schoolDocumentId, visual.code);
    await expect(detail).toBeVisible({ timeout: ACTION_TIMEOUT });
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(CAPTURES, '073-sitting-invalidate-desktop.png') });

    // The destructive confirmation, the pictured "Confirm" overlay shape.
    await invalidateButton(detail).click({ timeout: ACTION_TIMEOUT });
    await expect(page.getByText(cat(en, 'Ops.recovery.confirmBody'), { exact: true })).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await page.screenshot({ path: path.join(CAPTURES, '073-sitting-invalidate-confirm.png') });
    await page
      .getByRole('button', { name: cat(en, 'Ops.recovery.cancel'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });

    await page.setViewportSize({ width: 375, height: 812 });
    await panel.scrollIntoViewIfNeeded();
    await expect(detail).toBeVisible({ timeout: ACTION_TIMEOUT });
    // The roster table scrolls inside its own container; the page body never does.
    const bodyFits = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(bodyFits).toBe(true);
    await page.screenshot({ path: path.join(CAPTURES, '073-sitting-invalidate-375.png') });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    await panel.scrollIntoViewIfNeeded();
    await expect(detail).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, '073-sitting-invalidate-zoom200.png') });
  });

  test('a failed sittings read offers a retry instead of a silently empty picker', async ({
    page,
  }) => {
    await signInAsOps(page);
    // Only the LIST read is broken (it alone carries a query string); the
    // monitor read on /api/sittings/<id>/monitor is left alone.
    await page.route(/\/api\/sittings\?/, (route) => route.abort('failed'));
    await page.goto(`/dashboard/ops/schools/${schoolDocumentId}`);

    const error = page.locator('[data-surface="ops-sitting-recovery-error"]');
    await expect(error).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(error.getByText(cat(en, 'Ops.recovery.loadErrorTitle'))).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });

    await page.unroute(/\/api\/sittings\?/);
    await error
      .getByRole('button', { name: cat(en, 'Ops.recovery.retry'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });
});
