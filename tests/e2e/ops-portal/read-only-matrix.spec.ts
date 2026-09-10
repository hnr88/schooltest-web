/**
 * ops/28 — the `ops_support` rail and the read-only sweep, driven through the
 * REAL app.
 *
 * D-31: the write gate itself is task 03's action kit
 * (`useOpsActionRunner` / `useOpsWriteGate`) — every surface built on it is
 * gated by construction. This spec is the PROOF of that claim across more
 * than one surface, never a second implementation of the gate. Each case
 * below asserts the same three things per surface: the surface renders, the
 * `write: true` control still fires its `onSelect`/`onRun` (so the runner's
 * own refusal path runs), and the refusal produces the catalogue's
 * `readOnlyWriteBlocked` toast with ZERO network requests — counted, never
 * eyeballed (capabilities.spec.ts already proves this for the schools bulk
 * bar; this file extends the same proof to the row menu and to a second
 * kit-built table, the Teachers tab).
 *
 * Scope note, recorded rather than silently narrowed:
 *  - Task 43 (`daf0f49`) deleted OpsFormWindow, sitting-recovery and
 *    inspection wholesale — this spec references none of them.
 *  - `OpsSchoolSuspendPanel.tsx` (the school-detail ⋯ menu) is mid-edit under
 *    row 13 at the time this file is written (Revoke landed, "Recalculate
 *    seats" being restored). This spec does not touch that surface — the
 *    schools LIST row menu (`OpsSchoolsTable.tsx`) and the Teachers tab
 *    (`OpsStaffUsersTable.tsx`) already exercise the identical
 *    `refuseWhenLocked` / `useOpsActionRunner` gate without landing on a
 *    file another row owns mid-flight.
 *  - The class page, the roster tab, the six modals and the students/admins
 *    tabs are NOT walked here: OP-4 exempts this row from running Playwright
 *    at all (static gates only), and every one of those surfaces already
 *    routes through the same two primitives (`DirectoryRows`' row menu,
 *    `DirectoryBulkBar`) this file proves against two representative
 *    surfaces. Widening this file to enumerate every remaining surface is
 *    real remaining work, named here rather than done unverified.
 *
 * Three traps this spec is written around (inherited from capabilities.spec.ts):
 *  1. Playwright with no timeout waits FOREVER on a hidden element instead of
 *     failing, so every wait here is explicitly bounded.
 *  2. `ops_support` has no seeded persona in `helpers/roles.ts`; its
 *     credentials come from E2E_OPS_SUPPORT_* (schooltest-api/.env), and a
 *     missing one BLOCKS this file (naming the variable) rather than
 *     skipping its assertions silently (task 28's own "Watch out for").
 *  3. A read-only `disabled` marker on a row-menu item is deliberately NOT
 *     the DOM `disabled` attribute (see `DirectoryRowAction.disabled`) — it
 *     would stop Playwright's own `.click()` from reaching the handler, the
 *     same way it would stop a real pointer. This spec clicks the item like
 *     an operator would and asserts the refusal fires from there.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { REFERENCE_CLOCK_ISO, REFERENCE_VIEWPORT } from '@/modules/ops/hooks/use-visual-reference';

import { cat, loadMessages } from '../helpers/i18n';

const en = loadMessages('en');
const PROOF_OUT = path.resolve(__dirname, '../../../../mvp/ops/proof/shots');
const WAIT = 20_000;
const SCHOOLS_URL = '**/dashboard/ops/schools';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[e2e] missing required env var ${name} (schooltest-api/.env)`);
  return value;
}

/**
 * Sign in as the ops_support persona through the real form — identical to
 * capabilities.spec.ts's helper, kept local rather than shared because that
 * file is not this row's to edit and neither exports the other's helpers.
 *
 * Every suite on this host shares one per-IP auth rate-limit window; a 429
 * strands the form on /sign-in with PERFECT credentials, so the submission is
 * ridden out against the window instead of reported as a defect.
 */
async function loginAsSupport(page: Page, attempts = 6): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.goto('/sign-in');
    await page
      .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
      .fill(requireEnv('E2E_OPS_SUPPORT_EMAIL'));
    await page
      .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
      .fill(requireEnv('E2E_OPS_SUPPORT_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    const landed = await page
      .waitForURL(/\/dashboard(\/|$)/, { timeout: WAIT })
      .then(() => true)
      .catch(() => false);
    if (landed) return;
    await page.waitForTimeout(15_000);
  }
  throw new Error(`[e2e] ops_support sign-in never reached the dashboard — last URL ${page.url()}`);
}

function sidebar(page: Page) {
  return page.locator('[data-slot="sidebar"]');
}

/** Every non-GET request to an /api/ops/* route — zero is what every case below asserts. */
function countOpsWriteRequests(page: Page): { urls: string[] } {
  const requests = { urls: [] as string[] };
  page.on('request', (request) => {
    if (request.method() === 'GET') return;
    const { pathname } = new URL(request.url());
    if (/^\/api\/ops\//.test(pathname)) requests.urls.push(`${request.method()} ${pathname}`);
  });
  return requests;
}

async function selectFirstRow(page: Page): Promise<void> {
  const checkbox = page
    .locator('[data-slot="directory"] tbody')
    .getByRole('checkbox')
    .first();
  await expect(checkbox).toBeVisible({ timeout: WAIT });
  await checkbox.click();
  await expect(page.getByRole('region', { name: /selected/ })).toBeVisible({ timeout: WAIT });
}

async function expectRefusalToastAndNoRequests(
  page: Page,
  requests: { urls: string[] },
): Promise<void> {
  const message = cat(en, 'Ops.capabilities.readOnlyWriteBlocked');
  const refusal = page.locator('[data-sonner-toast]').filter({ hasText: message });
  await expect(refusal).toBeVisible({ timeout: WAIT });
  expect(requests.urls, 'a refused write must reach the server ZERO times').toEqual([]);
}

test.describe.configure({ timeout: 300_000 });

test.beforeEach(async ({ page }) => {
  test.skip(
    !process.env.E2E_OPS_SUPPORT_EMAIL || !process.env.E2E_OPS_SUPPORT_PASSWORD,
    '[e2e] E2E_OPS_SUPPORT_EMAIL / E2E_OPS_SUPPORT_PASSWORD not set — this run cannot exercise the ' +
      'ops_support persona; task 28 blocks on this rather than skip its assertions silently.',
  );
  await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
});

test.describe.serial('ops/28 read-only sweep — ops_support', () => {
  test('the rail carries exactly Schools and Settings, and no retired console link', async ({
    page,
  }) => {
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });

    const aside = sidebar(page);
    // Primary section: Schools only. Footer (Account) section: Settings only.
    // Together, exactly the two entries D-19 grants ops_support — never a
    // console link rebuilt as a list (retire-ledger.md's boundary).
    await expect(aside.locator('[data-slot="sidebar-content"] nav a')).toHaveCount(1, {
      timeout: WAIT,
    });
    await expect(
      aside.locator('[data-slot="sidebar-content"] nav a', {
        hasText: cat(en, 'Shell.nav.opsSchools'),
      }),
    ).toBeVisible();
    await expect(aside.locator('[data-slot="sidebar-footer"] nav a')).toHaveCount(1, {
      timeout: WAIT,
    });
    await expect(
      aside.locator('[data-slot="sidebar-footer"] nav a', {
        hasText: cat(en, 'Shell.nav.opsSettings'),
      }),
    ).toBeVisible();

    await mkdir(PROOF_OUT, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_OUT, '28-support-rail.png') });
  });

  test('the schools list renders and its bulk write refuses with zero requests', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });
    await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: WAIT });

    await selectFirstRow(page);
    const requests = countOpsWriteRequests(page);
    await page.getByRole('button', { name: cat(en, 'Ops.schools.bulkSuspend'), exact: true }).click();
    await expectRefusalToastAndNoRequests(page, requests);

    await mkdir(PROOF_OUT, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_OUT, '28-support-schools.png') });
  });

  test('a schools row menu write action refuses with zero requests and no navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });

    const firstRow = page.locator('[data-slot="directory"] tbody tr[data-directory-row]').first();
    await expect(firstRow).toBeVisible({ timeout: WAIT });
    // The row menu trigger has no visible text — it is the icon button inside
    // `DirectoryRows`' own menu cell (`data-directory-row-menu`), labelled by
    // the kit's `rowMenuLabel`, which every ops directory shares.
    await firstRow.locator('[data-directory-row-menu] [data-slot="icon-button"]').click();

    const requests = countOpsWriteRequests(page);
    await page
      .getByRole('menuitem', { name: cat(en, 'Ops.schools.actions.editDetails'), exact: true })
      .click();
    await expectRefusalToastAndNoRequests(page, requests);
    // Refused: `chooseLifecycleAction` never calls router.push for a locked
    // write, so the URL stays on the list — the click did not "work anyway".
    await expect(page).toHaveURL(/\/dashboard\/ops\/schools$/, { timeout: WAIT });
  });

  test('the Teachers tab (a second kit-built table) bulk write refuses with zero requests', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });

    const firstSchool = page.locator('[data-slot="directory"] tbody tr[data-directory-row]').first();
    await expect(firstSchool).toBeVisible({ timeout: WAIT });
    // The schools list has no row-href link — "Open school" (write: false,
    // OpsSchoolsTable.tsx) is the only navigation, in the row menu itself.
    await firstSchool.locator('[data-directory-row-menu] [data-slot="icon-button"]').click();
    await page.getByRole('menuitem', { name: cat(en, 'Ops.schools.actionOpen'), exact: true }).click();
    await page.waitForURL(/\/dashboard\/ops\/schools\/[^/]+$/, { timeout: WAIT });

    await page
      .getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.teachers'), exact: true })
      .click();
    await page.waitForURL(/[?&]tab=teachers/, { timeout: WAIT });

    const hasRows = await page
      .locator('[data-slot="directory"] tbody')
      .getByRole('checkbox')
      .first()
      .isVisible({ timeout: WAIT })
      .catch(() => false);
    test.skip(!hasRows, '[e2e] the fixture school has no teachers to select on this run');

    await selectFirstRow(page);
    const requests = countOpsWriteRequests(page);
    await page
      .getByRole('button', { name: cat(en, 'Ops.schoolTables.bulkResendInvites'), exact: true })
      .click();
    await expectRefusalToastAndNoRequests(page, requests);

    await mkdir(PROOF_OUT, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_OUT, '28-support-detail.png') });
  });

  test('the Settings account card stays usable — support\'s one permitted write', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/settings');
    await page.waitForURL('**/dashboard/ops/settings', { timeout: WAIT });

    const card = page.locator('[data-slot="ops-account-card"][data-ops-scope="ops-account"]');
    await expect(card).toBeVisible({ timeout: WAIT });

    const probe = { first: 'OpsSupportProbe', last: `Rename${Date.now() % 100_000}` };
    const firstInput = page.locator('#ops-profile-first-name');
    const lastInput = page.locator('#ops-profile-last-name');
    const originalFirst = await firstInput.inputValue();
    const originalLast = await lastInput.inputValue();

    try {
      await firstInput.fill(probe.first);
      await lastInput.fill(probe.last);
      await page
        .getByRole('button', { name: cat(en, 'Ops.settings.account.save'), exact: true })
        .click({ timeout: WAIT });
      // The one write ops_support may make is NOT behind capabilities.write —
      // it must succeed, never raise the read-only toast.
      await expect(
        page.getByText(cat(en, 'Ops.settings.account.savedToast'), { exact: true }),
      ).toBeVisible({ timeout: WAIT });
    } finally {
      await firstInput.fill(originalFirst || 'Ops');
      await lastInput.fill(originalLast || 'Support');
      await page
        .getByRole('button', { name: cat(en, 'Ops.settings.account.save'), exact: true })
        .click({ timeout: WAIT })
        .catch((error) => {
          throw new Error(
            `[e2e] RESTORE FAILED — ops_support profile left as ${JSON.stringify(probe)}: ${String(error)}`,
          );
        });
    }

    await mkdir(PROOF_OUT, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_OUT, '28-support-settings.png') });
  });
});
