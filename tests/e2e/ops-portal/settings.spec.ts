/**
 * C-OPS-PORTAL-031 — the browser half of the settings WRITE and the ops
 * self-profile card.
 *
 * Three things are proven here that an API test cannot:
 *  1. A save through the real form persists: the tagline written in the UI is
 *     what the API serves afterwards, and the singleton is restored in a
 *     finally so a red run never leaves the row dirty.
 *  2. A stale edit (412 SETTINGS_VERSION_STALE) is named by a toast and the
 *     typed draft survives — no refetch hydrates over what the operator wrote.
 *  3. The account card renames the signed-in operator through
 *     PATCH /api/ops/profile and the capabilities read serves the new name;
 *     the original names are restored in a finally (a null original is
 *     restored to a neutral fixture value and the receipt is logged).
 *
 * ops_support coverage stays in the API spec (403 on both writes) and in
 * retained-tools.spec.ts (the support surface on this route); this file
 * mints ONE ops login, reused as storage state, inside the shared 20/minute
 * auth budget. Behavioural spec: no visual captures.
 */
import { expect, test } from '@playwright/test';

import {
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';

import { cat, loadMessages } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';

import {
  ACTION_TIMEOUT,
  API_BASE_URL,
  READY,
  SETTINGS_ROUTE,
  STORAGE_STATE,
  liveSettings,
  opsJwt,
  waitForApi,
} from './settings-read.helpers';

const en = loadMessages('en');

test.use({
  viewport: REFERENCE_VIEWPORT,
  deviceScaleFactor: REFERENCE_DEVICE_SCALE_FACTOR,
  actionTimeout: ACTION_TIMEOUT,
  storageState: STORAGE_STATE,
});

test.beforeAll(async ({ browser }) => {
  test.setTimeout(300_000);
  // Explicitly EMPTY: `browser.newContext()` inherits the file's contextOptions,
  // and the state file this hook is about to write does not exist yet.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await waitForApi(120_000);
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await loginAs(page, 'ops');
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  await context.storageState({ path: STORAGE_STATE });
  await context.close();
});

test.beforeEach(async () => {
  test.setTimeout(150_000);
  await waitForApi(90_000);
});

/** Writes the singleton back through the real endpoint as ops. */
async function putSettings(patch: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/platform-settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${await opsJwt()}`,
      'Content-Type': 'application/json',
      'X-Ops-Portal-Version': '1',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`[e2e] settings restore failed: HTTP ${res.status}`);
}

type Actor = { first_name: string | null; last_name: string | null };

/** The operator row exactly as the capabilities read serves it. */
async function liveActor(): Promise<Actor> {
  const res = await fetch(`${API_BASE_URL}/api/ops/capabilities`, {
    headers: { Authorization: `Bearer ${await opsJwt()}`, 'X-Ops-Portal-Version': '1' },
  });
  if (!res.ok) throw new Error(`[e2e] capabilities read failed: HTTP ${res.status}`);
  return ((await res.json()) as { data: { actor: Actor } }).data.actor;
}

/** Restores the operator's names through the self-profile endpoint. */
async function patchProfile(firstName: string, lastName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/ops/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${await opsJwt()}`,
      'Content-Type': 'application/json',
      'X-Ops-Portal-Version': '1',
    },
    body: JSON.stringify({ first_name: firstName, last_name: lastName }),
  });
  if (!res.ok) throw new Error(`[e2e] profile restore failed: HTTP ${res.status}`);
}

test.describe.configure({ mode: 'serial' });

test.describe('C-OPS-PORTAL-031 settings write', () => {
  test('a saved change is what the API serves afterwards', async ({ page }) => {
    const original = (await liveSettings()).site_tagline as string | null;
    const probe = `ops-031 probe ${Date.now()}`;
    try {
      await page.goto(SETTINGS_ROUTE);
      await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });

      await page.locator('#setting-site_tagline').fill(probe);
      await page
        .getByRole('button', { name: cat(en, 'Ops.settings.save'), exact: true })
        .click({ timeout: ACTION_TIMEOUT });
      await expect(
        page.getByText(cat(en, 'Ops.settings.savedToast'), { exact: true }),
      ).toBeVisible({ timeout: ACTION_TIMEOUT });

      expect((await liveSettings()).site_tagline, 'the read-back must serve the saved value').toBe(
        probe,
      );
    } finally {
      // The singleton is shared with every other suite: always put it back,
      // and a failed restore fails the test with the values as the receipt.
      try {
        await putSettings({ site_tagline: original });
      } catch (error) {
        throw new Error(
          `[e2e] RESTORE FAILED — site_tagline left as ${JSON.stringify(probe)}, ` +
            `original was ${JSON.stringify(original)}: ${String(error)}`,
        );
      }
    }
  });

  test('a stale edit is named and the typed draft survives', async ({ page }) => {
    const staleBody = {
      data: null,
      error: {
        status: 412,
        name: 'PreconditionFailedError',
        message: 'the settings changed since you loaded them',
        details: { code: 'SETTINGS_VERSION_STALE' },
      },
    };
    await page.route('**/api/platform-settings', async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      await route.fulfill({
        status: 412,
        contentType: 'application/json',
        body: JSON.stringify(staleBody),
      });
    });

    await page.goto(SETTINGS_ROUTE);
    await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });

    const draft = `stale draft ${Date.now()}`;
    await page.locator('#setting-site_tagline').fill(draft);
    await page
      .getByRole('button', { name: cat(en, 'Ops.settings.save'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });

    await expect(
      page.getByText(cat(en, 'Ops.settings.staleToast'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    // No refetch, no values-hydration: what the operator typed is still there.
    await expect(page.locator('#setting-site_tagline')).toHaveValue(draft);
  });

  test('the account card renames the operator and the read serves the new name', async ({
    page,
  }) => {
    const original = await liveActor();
    const probe = { first: 'OpsProbe', last: `Rename${Date.now() % 100_000}` };
    try {
      await page.goto(SETTINGS_ROUTE);
      // The card renders in every settings state, above the ops-only form.
      await expect(
        page.locator('[data-slot="ops-account-card"][data-ops-scope="ops-account"]'),
      ).toBeVisible({ timeout: ACTION_TIMEOUT });

      await page.locator('#ops-profile-first-name').fill(probe.first);
      await page.locator('#ops-profile-last-name').fill(probe.last);
      await page
        .getByRole('button', { name: cat(en, 'Ops.settings.account.save'), exact: true })
        .click({ timeout: ACTION_TIMEOUT });
      await expect(
        page.getByText(cat(en, 'Ops.settings.account.savedToast'), { exact: true }),
      ).toBeVisible({ timeout: ACTION_TIMEOUT });

      const actor = await liveActor();
      expect(actor.first_name, 'capabilities must serve the saved first name').toBe(probe.first);
      expect(actor.last_name, 'capabilities must serve the saved last name').toBe(probe.last);
    } finally {
      // A null original cannot be restored (the schema requires min 1): put a
      // neutral fixture name back and log the receipt, matching the API spec.
      const restore = {
        first: original.first_name ?? 'Ops',
        last: original.last_name ?? 'Fixture',
      };
      if (original.first_name === null || original.last_name === null) {
        console.warn(
          `[e2e] original name was ${JSON.stringify(original)} — restoring neutral ` +
            `${JSON.stringify(restore)} instead`,
        );
      }
      try {
        await patchProfile(restore.first, restore.last);
      } catch (error) {
        throw new Error(
          `[e2e] RESTORE FAILED — profile left as ${JSON.stringify(probe)}, ` +
            `original was ${JSON.stringify(original)}: ${String(error)}`,
        );
      }
    }
  });
});
