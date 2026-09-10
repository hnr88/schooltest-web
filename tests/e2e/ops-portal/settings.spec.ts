/**
 * C-OPS-PORTAL-031 — the browser half of the ops self-profile card.
 *
 * Proven here, and provable no other way: the account card renames the
 * signed-in operator through PATCH /api/ops/profile and the capabilities read
 * serves the new name; the original names are restored in a finally (a null
 * original is restored to a neutral fixture value and the receipt is
 * logged).
 *
 * Task 42 (R-15) retired the six-group platform-settings form this file used
 * to drive — that WRITE and its stale-edit (412) behaviour no longer have UI
 * to test. ops_support coverage stays in the API spec (403 on both writes);
 * this file mints ONE ops login, reused as storage state, inside the shared
 * 20/minute auth budget. Behavioural spec: no visual captures.
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
  SETTINGS_ROUTE,
  STORAGE_STATE,
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
