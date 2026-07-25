import { expect, test, type Page } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { E2E_PASSWORD, registerAndConfirmParent } from './helpers/throwaway-parent';
import { selectRadioChip } from './helpers/wizard-fill';

// Wave 6 (st-portal-fixes): the onboarding wizard is now welcome → parent
// profile → finish. Covers the three user reports: (1) stuck-after-complete —
// the done panel renders from the mutation response (setQueryData), never from
// a refetch, and a failed POST surfaces an error toast; (2) the dashboard flash
// before the guard redirects a pending parent; (3) onboarding collects the
// parent profile via the real PUT /api/users/me contract (C-PAR-UPDATE-ME).
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
const usedEmails: string[] = [];

// Country display names come from Intl.DisplayNames (no catalog entry) — Node
// and the browser both carry full ICU, so "MY" resolves to the same string.
const MALAYSIA = new Intl.DisplayNames(['en'], { type: 'region' }).of('MY') ?? 'Malaysia';

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

test.describe.configure({ mode: 'serial' });

// UI logins POST /api/auth/local, guarded at 20/min (helpers/auth.ts pacing).
const MIN_LOGIN_INTERVAL_MS = 3100;
let lastLoginAt = 0;

async function uiLogin(page: Page, email: string): Promise<void> {
  const since = Date.now() - lastLoginAt;
  if (lastLoginAt !== 0 && since < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - since);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  lastLoginAt = Date.now();
}

// Fills every required profile field with values the server whitelist accepts.
async function fillValidProfile(page: Page): Promise<void> {
  await page.locator('#onboarding-first-name').fill('E2E');
  await page.locator('#onboarding-last-name').fill('Parent');
  await selectRadioChip(
    page.getByRole('radiogroup', { name: cat(en, 'Onboarding.profile.relationship') }),
    cat(en, 'Onboarding.profile.relationshipOptions.mother'),
  );
  await page.locator('#onboarding-phone').fill('+60 12-345 6789');
  await selectRadioChip(
    page.getByRole('radiogroup', { name: cat(en, 'Onboarding.profile.preferredContact') }),
    cat(en, 'Onboarding.profile.contactOptions.email'),
  );
  await page.locator('#onboarding-address-line').fill('1 Jalan Test');
  await page.locator('#onboarding-city').fill('Kuala Lumpur');
  const country = page.getByRole('combobox', { name: cat(en, 'Onboarding.profile.country') });
  await country.click();
  await country.fill(MALAYSIA);
  await page.getByRole('option', { name: MALAYSIA, exact: true }).click();
  await page.locator('#onboarding-emergency-name').fill('Emergency Person');
  await page.locator('#onboarding-emergency-phone').fill('+60 13-987 6543');
}

async function saveProfileButton(page: Page) {
  return page.getByRole('button', { name: cat(en, 'Onboarding.saveProfile'), exact: true });
}

test('fresh parent: no dashboard flash, profile validation, save, complete, stays on dashboard', async ({
  page,
  request,
}) => {
  test.slow();
  const parent = await registerAndConfirmParent(request, 'onbprof');
  usedEmails.push(parent.email);
  await page.setViewportSize(DESKTOP);

  // Flash detector: the guard must never paint the dashboard while a pending
  // parent is being redirected — one rendered frame is already the bug. A
  // MutationObserver (installed before sign-in, surviving the client-side
  // push to /dashboard) records any appearance of the dashboard greeting.
  const welcomePrefix = cat(en, 'Dashboard.welcomeTitle').split('{name}')[0];
  await page.addInitScript((prefix) => {
    const w = window as unknown as { __sawDashboardHeading: boolean };
    w.__sawDashboardHeading = false;
    const check = () => {
      const h1 = document.querySelector('h1');
      if (h1?.textContent?.startsWith(prefix)) {
        w.__sawDashboardHeading = true;
      }
    };
    const observer = new MutationObserver(check);
    const start = () => {
      check();
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
  }, welcomePrefix);

  await uiLogin(page, parent.email);
  await page.waitForURL('**/onboarding');
  await expect(page.getByText(cat(en, 'Onboarding.stepWelcomeTitle'))).toBeVisible();
  const sawFlash = await page.evaluate(
    () => (window as unknown as { __sawDashboardHeading: boolean }).__sawDashboardHeading,
  );
  expect(sawFlash).toBe(false);

  // Welcome → profile step.
  await page.getByRole('button', { name: cat(en, 'Onboarding.continue'), exact: true }).click();
  await expect(
    page.getByRole('heading', { name: cat(en, 'Onboarding.stepProfileTitle') }),
  ).toBeVisible();

  let putCount = 0;
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().endsWith('/api/users/me')) putCount += 1;
  });

  // Empty submit: required errors on the completion-rule fields, no PUT.
  await (await saveProfileButton(page)).click();
  await expect(page.locator('#onboarding-first-name-error')).toHaveText(
    cat(en, 'Onboarding.schema.required'),
  );
  await expect(page.locator('#onboarding-country-error')).toHaveText(
    cat(en, 'Onboarding.schema.required'),
  );
  expect(putCount).toBe(0);

  // Invalid phone + non-listed country: still blocked, still no PUT. The
  // combobox popup opened by typing must be closed BEFORE clicking save —
  // an outside pointerdown just closes the popup and swallows the click.
  await page.locator('#onboarding-phone').fill('abc');
  await page
    .getByRole('combobox', { name: cat(en, 'Onboarding.profile.country') })
    .fill('Narnia');
  await page.keyboard.press('Escape');
  await (await saveProfileButton(page)).click();
  await expect(page.locator('#onboarding-phone-error')).toHaveText(
    cat(en, 'Onboarding.schema.phoneInvalid'),
  );
  await expect(page.locator('#onboarding-country-error')).toBeVisible();
  expect(putCount).toBe(0);

  // Valid fill: real PUT 200, profileCompleted true, advance to finish.
  await fillValidProfile(page);
  const putResponse = page.waitForResponse(
    (res) => res.request().method() === 'PUT' && res.url().endsWith('/api/users/me'),
  );
  await (await saveProfileButton(page)).click();
  const put = await putResponse;
  expect(put.status()).toBe(200);
  const putBody = (await put.json()) as { profileCompleted?: boolean };
  expect(putBody.profileCompleted).toBe(true);
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
    cat(en, 'Onboarding.profileSaved'),
  );
  await expect(
    page.getByRole('heading', { name: cat(en, 'Onboarding.finishTitle') }),
  ).toBeVisible();

  // Get started → real POST → done panel → dashboard, sticky across reload.
  const postResponse = page.waitForResponse(
    (res) => res.request().method() === 'POST' && res.url().endsWith('/api/users/me/onboarding'),
  );
  await page.getByRole('button', { name: cat(en, 'Onboarding.complete'), exact: true }).click();
  expect((await postResponse).status()).toBe(200);
  await expect(
    page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.reload();
  await expect(page.getByRole('heading', { name: new RegExp(`^${welcomePrefix}`) })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('failed complete POST shows an error toast and stays on finish; success renders from cache, not refetch', async ({
  page,
  request,
}) => {
  test.slow();
  const parent = await registerAndConfirmParent(request, 'onberr');
  usedEmails.push(parent.email);
  await page.setViewportSize(DESKTOP);

  await uiLogin(page, parent.email);
  await page.waitForURL('**/onboarding');
  await page.getByRole('button', { name: cat(en, 'Onboarding.continue'), exact: true }).click();
  await fillValidProfile(page);
  await (await saveProfileButton(page)).click();
  await expect(
    page.getByRole('heading', { name: cat(en, 'Onboarding.finishTitle') }),
  ).toBeVisible();

  // Route interception is used for the ERROR PATH ONLY: a 500 POST must toast
  // and leave the parent on the finish step — no fake success state.
  await page.route('**/api/users/me/onboarding', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { status: 500, message: 'boom' } }),
      });
    }
    return route.continue();
  });
  await page.getByRole('button', { name: cat(en, 'Onboarding.complete'), exact: true }).click();
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(
    cat(en, 'Onboarding.updateError'),
  );
  await expect(
    page.getByRole('heading', { name: cat(en, 'Onboarding.finishTitle') }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }),
  ).toHaveCount(0);

  // Success path: the POST goes to the REAL api; the invalidated GET refetch
  // is aborted. The done panel must still render — it comes from the mutation
  // response seeded into the cache (setQueryData), not from a refetch.
  await page.unroute('**/api/users/me/onboarding');
  await page.route('**/api/users/me/onboarding', (route) => {
    if (route.request().method() === 'GET') {
      return route.abort();
    }
    return route.continue();
  });
  const postResponse = page.waitForResponse(
    (res) => res.request().method() === 'POST' && res.url().endsWith('/api/users/me/onboarding'),
  );
  await page.getByRole('button', { name: cat(en, 'Onboarding.complete'), exact: true }).click();
  expect((await postResponse).status()).toBe(200);
  await expect(
    page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }),
  ).toBeVisible();
});
