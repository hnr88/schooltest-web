/**
 * FLEETFIX-B — live proof for three confirmed auth-flow defects. Scratch spec
 * kept as evidence (screenshots: tests/e2e/captures/fleetfix/).
 *
 * D2 (HIGH): `ops_support` was missing from ROLE_DESTINATIONS, so the role sat
 *   stranded on /dashboard after sign-in. It must land on /dashboard/ops — the
 *   same portal the nav rail already admits it to (isOpsPortalRole).
 * D7 (MED): double-clicking "Log in" fired two POST /api/auth/local (the
 *   button only disabled a re-render after the async resolver started). The
 *   form now guards submit with a synchronous ref — exactly ONE request.
 * D12 (LOW): signed-out /dashboard/teach/classes rendered the 404 wall instead
 *   of the sign-in bounce every other guarded route performs.
 *
 * Serial on purpose: the login POSTs share the API's brute-force pacing
 * (20 POST /api/auth/local per minute per IP), and fleet agents may be running
 * against the same API concurrently.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const CAPTURES = path.resolve(process.cwd(), 'tests/e2e/captures/fleetfix');
mkdirSync(CAPTURES, { recursive: true });

test.describe.configure({ mode: 'serial' });

/** Counts every POST to /api/auth/local on ANY host (the form posts straight to the API origin). */
function countLoginPosts(page: Page): { posts: () => number; log: () => string[] } {
  const events: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).pathname === '/api/auth/local' && r.method() === 'POST') {
      events.push(`POST ${r.url()}`);
    }
  });
  page.on('response', (r) => {
    if (new URL(r.url()).pathname === '/api/auth/local') events.push(`  -> ${r.status()}`);
  });
  return { posts: () => events.filter((e) => e.startsWith('POST')).length, log: () => events };
}

test('D12: signed-out /dashboard/teach/classes bounces to sign-in (not the 404 wall)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/dashboard/teach/classes');

  // The guard chain must land on the sign-in screen, not "This page hopped away".
  await page.waitForURL(/sign-in/, { timeout: 20_000 });
  expect(page.url()).toContain('/sign-in');
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText('This page hopped away')).toHaveCount(0);

  await page.screenshot({
    path: path.join(CAPTURES, 'fleetfix-b-teach-classes-bounce.png'),
    fullPage: true,
  });
});

test('D2: ops_support signs in through the real form and lands on /dashboard/ops', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const counter = countLoginPosts(page);

  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill('opssupport@schooltest.local');
  await page.getByLabel('Password', { exact: true }).fill('SupWvEStNXzqs6rljOl5YOSm!7');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  // ROLE_DESTINATIONS[ops_support] = '/dashboard/ops': the gate must replace the
  // bare /dashboard landing with the ops portal. The gate falls through to the
  // overview while /api/users/me is unresolved-and-errored, and the shared API
  // rate window (120 req/min/IP, fleet agents run concurrently) can throttle
  // exactly that call — so retry across windows, reloading each time, before
  // judging the row. The assertion itself never loosens.
  let landed = /\/dashboard\/ops(\/|$)/.test(page.url());
  for (let attempt = 0; attempt < 4 && !landed; attempt += 1) {
    await page.waitForTimeout(15_000);
    await page.reload();
    landed = await page
      .waitForURL(/\/dashboard\/ops(\/|$)/, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(landed, `never landed on /dashboard/ops; stuck on ${page.url()}`).toBe(true);
  // The portal indexes /dashboard/ops onto /dashboard/ops/schools — both are the ops landing.
  expect(new URL(page.url()).pathname).toMatch(/^\/dashboard\/ops(\/|$)/);
  expect(counter.posts()).toBe(1);

  await page.screenshot({
    path: path.join(CAPTURES, 'fleetfix-b-ops-support-landing.png'),
    fullPage: true,
  });
});

test('D7: double-clicking "Log in" fires exactly ONE POST /api/auth/local', async ({ page }) => {
  test.setTimeout(120_000);
  const counter = countLoginPosts(page);

  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill('admin@schooltest.local');
  await page.getByLabel('Password', { exact: true }).fill('Admin1234!');
  const button = page.getByRole('button', { name: 'Log in', exact: true });

  // The original race: two submits ~33ms apart, the second inside the window
  // before the loading state re-rendered. The second submit is dispatched
  // immediately after the first click returns — a locator-driven click here
  // would wait on actionability and lose the race it is trying to reproduce
  // (the button label flips to "Logging in…" a re-render after click one).
  await button.click();
  await page.evaluate(() => {
    const form = document.querySelector<HTMLButtonElement>('button[type="submit"]')?.form;
    if (form) form.requestSubmit();
  });

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  const posts = counter.posts();
  if (posts !== 1) {
    throw new Error(
      `[fleetfix-b] expected exactly 1 POST /api/auth/local, saw ${posts} ` +
        `(final URL ${page.url()}; events: ${counter.log().join(' | ') || 'none'}). ` +
        'A non-1 count with a 429 response means the API brute-force limiter was hot ' +
        '(fleet agents on the same API) — re-run this spec alone before blaming the fix.',
    );
  }
  console.log(`[fleetfix-b] D7 login POSTs: ${posts} [${counter.log().join(' | ')}]`);
  // Landing sanity: past the sign-in wall and into the portal (the seeded
  // admin@schooltest.local carries the ops role on this stack, so the gate
  // sends it to /dashboard/ops — the request count is the defect under test).
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 });
  expect(new URL(page.url()).pathname).toMatch(/^\/dashboard/);
  await page.waitForTimeout(4000); // let the portal settle past its skeletons for the evidence shot

  await page.screenshot({
    path: path.join(CAPTURES, 'fleetfix-b-dblclick-one-request.png'),
    fullPage: true,
  });
});
