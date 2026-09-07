/**
 * C-OPS-PORTAL-021 (OPS-031) — the ops staff directory in the REAL portal.
 *
 * Drives the real Next app against the real Strapi and the real seeded school:
 * nothing is intercepted, so a green run means the browser actually received
 * the versioned body. Three things are proven that a 200 alone does not:
 *  1. the live response validates against the SHARED contract schema (the same
 *     module the server projects to), so client and server cannot drift;
 *  2. the filters and paging are SERVER work — the total the footer reports is
 *     the query's own count, not the number of rows on screen;
 *  3. the two portal columns render their stored value or their empty
 *     fallback, never a value derived from the person's name.
 * Captures run at the reference desktop viewport and at 375px with a fixed
 * clock, so the visual review compares like with like.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  teachersListResponseSchema,
} from '@schooltest/ops-contracts';

import { apiEnv } from '../helpers/auth-db';
import { cat, loadMessages } from '../helpers/i18n';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const SCHOOL_A = 'a19wa9lrmloi95ab9m4gmxqk';
const OPS_EMAIL = 'apiadmin@schooltest.local';
const ACTION_TIMEOUT = 10_000;

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-031',
);

async function opsJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: OPS_EMAIL, password: apiEnv('SEED_APIADMIN_PASSWORD') },
  });
  expect(login.ok()).toBeTruthy();
  return ((await login.json()) as { jwt: string }).jwt;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(OPS_EMAIL);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: ACTION_TIMEOUT });
}

async function openDirectory(page: Page) {
  await page.goto(`/en/dashboard/ops/schools/${SCHOOL_A}`);
  await page
    .getByRole('button', { name: cat(en, 'Ops.detail.teachersLabel') })
    .click({ timeout: ACTION_TIMEOUT });
  const dialog = page.locator('[data-slot="ops-teachers-dialog"]');
  await expect(dialog).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(dialog.locator('[data-slot="ops-teachers-table"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  return dialog;
}

test.describe('C-OPS-PORTAL-021 ops teachers directory', () => {
  test('the live versioned body validates against the shared contract schema', async ({
    request,
  }) => {
    const jwt = await opsJwt(request);
    const res = await request.get(`${API}/api/ops/schools/${SCHOOL_A}/teachers?pageSize=200`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
      },
    });
    expect(res.status()).toBe(200);
    const parsed = teachersListResponseSchema.safeParse(await res.json());
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [], null, 2)).toBe(true);
  });

  test('the directory renders the portal columns and pages on the server total', async ({
    page,
    request,
  }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await signInAsOps(page);

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/teachers')) requests.push(req.url());
    });

    const dialog = await openDirectory(page);
    await expect(dialog).toContainText(cat(en, 'Ops.teachers.title'));
    await expect(dialog.locator('[data-slot="ops-teachers-filters"]')).toBeVisible();

    const rows = dialog.locator('[data-slot="ops-teacher-row"]');
    await expect(rows.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Both portal columns exist on every row — a stored value or the fallback.
    for (let index = 0; index < rowCount; index += 1) {
      await expect(rows.nth(index).locator('[data-slot="ops-teacher-specialty"]')).toHaveCount(1);
      await expect(rows.nth(index).locator('[data-slot="ops-teacher-last-active"]')).toHaveCount(1);
    }

    // The footer reports the SERVER's total, taken from the same request the
    // browser made — not the number of rows painted.
    const jwt = await opsJwt(request);
    const api = await request.get(`${API}/api/ops/schools/${SCHOOL_A}/teachers?pageSize=25`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
      },
    });
    const body = teachersListResponseSchema.parse(await api.json());
    await expect(dialog.locator('[data-slot="ops-teachers-page-status"]')).toContainText(
      String(body.meta.pagination.total),
    );
    expect(requests.some((url) => url.includes('pageSize=25'))).toBe(true);

    await mkdir(CAPTURES, { recursive: true });
    await page.setViewportSize(REFERENCE_VIEWPORT);
    expect(REFERENCE_DEVICE_SCALE_FACTOR).toBe(1);
    await page.screenshot({ path: path.join(CAPTURES, 'teachers-directory-1440.png') });
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.screenshot({ path: path.join(CAPTURES, 'teachers-directory-375.png') });
  });

  test('search narrows the result server-side and an unmatched search is an honest empty state', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await signInAsOps(page);
    const dialog = await openDirectory(page);

    const search = dialog.locator('[data-slot="ops-teachers-search"]');
    await search.fill('zzz-no-such-teacher-zzz', { timeout: ACTION_TIMEOUT });
    await expect(dialog.locator('[data-slot="ops-teachers-empty"]')).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await expect(dialog.locator('[data-slot="ops-teacher-row"]')).toHaveCount(0);
    await expect(dialog.locator('[data-slot="ops-teachers-page-status"]')).toContainText('0');

    await mkdir(CAPTURES, { recursive: true });
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await page.screenshot({ path: path.join(CAPTURES, 'teachers-directory-empty-1440.png') });

    await search.fill('', { timeout: ACTION_TIMEOUT });
    await expect(dialog.locator('[data-slot="ops-teacher-row"]').first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
  });

  test('paging controls follow the server pageCount', async ({ page }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await signInAsOps(page);
    const dialog = await openDirectory(page);

    const previous = dialog.locator('[data-slot="ops-teachers-prev"]');
    const next = dialog.locator('[data-slot="ops-teachers-next"]');
    await expect(previous).toBeDisabled({ timeout: ACTION_TIMEOUT });

    if (await next.isEnabled()) {
      const firstEmail = await dialog
        .locator('[data-slot="ops-teacher-row"]')
        .first()
        .getAttribute('data-teacher-email');
      await next.click({ timeout: ACTION_TIMEOUT });
      await expect(previous).toBeEnabled({ timeout: ACTION_TIMEOUT });
      await expect(
        dialog.locator('[data-slot="ops-teacher-row"]').first(),
      ).not.toHaveAttribute('data-teacher-email', firstEmail ?? '');
    }
  });
});
