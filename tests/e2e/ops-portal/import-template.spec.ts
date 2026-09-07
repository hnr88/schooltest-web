/**
 * OPS-056 — the ops import panel's template download, driven through the real
 * browser against the real API.
 *
 * What this proves that the API spec cannot: the button the operator can see
 * fetches the template from the SERVER (carrying X-Ops-Portal-Version: 1) and
 * saves those exact bytes — it is no longer a client-side blob assembled from a
 * copy of the column list that could drift from the parser. And that a refused
 * download saves NOTHING: an error envelope must never land on disk as a `.csv`.
 *
 * visualCheck: the pictured help row (mvp/ops/Ops Portal.dc.html:802) is
 * captured at the reference desktop viewport and at 375px under the frozen
 * reference clock, using the shared OPS-010 constants.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';

import { roleCredentials } from '../helpers/credentials';
import { fixtureSchoolId } from '../helpers/fixture-ids';
import { cat, loadMessages } from '../helpers/i18n';

const en = loadMessages('en');
const OPS = roleCredentials('ops');

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-056',
);

/** The pictured portal columns, written out rather than imported (see the API spec). */
const PORTAL_COLUMNS = [
  'given name',
  'family name',
  'date of birth',
  'year level',
  'home language',
];
const PORTAL_HEADER_LINE = PORTAL_COLUMNS.join(',');

const TEMPLATE_URL_GLOB = '**/import-students/template.csv*';
const ACTION_TIMEOUT = 15_000;

const panelOf = (page: Page) => page.locator('[data-surface="ops-student-import"]');
const downloadTrigger = (page: Page) =>
  panelOf(page).locator('[data-surface="ops-import-template-download"]');

async function signInAsOps(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(OPS.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(OPS.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/ops/schools', { timeout: 90_000 });
  await page.goto(`/dashboard/ops/schools/${fixtureSchoolId()}`);
  await expect(panelOf(page)).toBeVisible({ timeout: 20_000 });
}

test.describe('OPS-056 import template download', () => {
  test.describe.configure({ timeout: 120_000 });
  test.use({
    viewport: REFERENCE_VIEWPORT,
    deviceScaleFactor: REFERENCE_DEVICE_SCALE_FACTOR,
  });

  test('the pictured help row lists the portal columns and downloads them', async ({ page }) => {
    await signInAsOps(page);
    const panel = panelOf(page);

    // The vocabulary the operator is told to use…
    const columns = panel.locator('[data-surface="ops-import-template-columns"]');
    await expect(columns).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(columns).toContainText(PORTAL_COLUMNS.join(', '));
    // …and never the legacy email column the portal template dropped.
    await expect(columns).not.toContainText('email');

    const [request, download] = await Promise.all([
      page.waitForRequest(
        (candidate) => candidate.url().includes('/import-students/template.csv'),
        { timeout: ACTION_TIMEOUT },
      ),
      page.waitForEvent('download', { timeout: ACTION_TIMEOUT }),
      downloadTrigger(page).click({ timeout: ACTION_TIMEOUT }),
    ]);

    // The versioned contract was requested explicitly — the header is opt-in per
    // request, never attached globally.
    expect(request.headers()['x-ops-portal-version']).toBe('1');
    expect(request.headers().authorization).toContain('Bearer ');

    // The file the browser saved is the SERVER's, named by the server.
    expect(download.suggestedFilename()).toMatch(/^student-import-template.*\.csv$/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const csv = Buffer.concat(chunks).toString('utf8');
    expect(csv.split('\r\n')[0]).toBe(PORTAL_HEADER_LINE);
    expect(csv).not.toContain('@');

    await mkdir(CAPTURES, { recursive: true });
    await panel.screenshot({ path: path.join(CAPTURES, 'import-template-desktop-1440.png') });

    await page.setViewportSize(MOBILE_VIEWPORT);
    await expect(columns).toBeVisible({ timeout: ACTION_TIMEOUT });
    await panel.screenshot({ path: path.join(CAPTURES, 'import-template-mobile-375.png') });
  });

  test('a refused download surfaces the error and writes no file', async ({ page }) => {
    await signInAsOps(page);

    await page.route(TEMPLATE_URL_GLOB, (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            status: 403,
            name: 'ForbiddenError',
            message: 'Forbidden',
            details: {},
          },
        }),
      }),
    );

    await downloadTrigger(page).click({ timeout: ACTION_TIMEOUT });

    await expect(
      panelOf(page).locator('[data-surface="ops-import-template-error"]'),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });

    // The refused body is an error envelope. It must never be saved as a CSV.
    await expect(page.waitForEvent('download', { timeout: 3_000 })).rejects.toThrow();
  });
});
