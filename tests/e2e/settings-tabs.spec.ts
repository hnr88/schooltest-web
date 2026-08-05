import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { skipOnboardingViaUi } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

const en = loadMessages('en');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5500';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const SETTINGS_PARENT = { email: 'parent-t06@schooltest.local', password: 'Parent1234!' };
const CHANGED_PASSWORD = 'Settings1234!';

interface SearchPreference {
  default_states: string[];
  default_school_types: string[];
  default_sectors: string[];
  default_sort: string;
  default_page_size: number;
  default_fee_min: number | null;
  default_fee_max: number | null;
}

async function signInAs(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  account: { email: string; password: string },
): Promise<void> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: account.email, password: account.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { jwt } = (await response.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

async function readSearchPreferences(
  request: import('@playwright/test').APIRequestContext,
): Promise<{ jwt: string; preferences: SearchPreference }> {
  const login = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  const response = await request.get(`${API_BASE_URL}/api/search-preferences/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { data } = (await response.json()) as { data: SearchPreference };
  return { jwt, preferences: data };
}

function preferencePayload(preferences: SearchPreference): SearchPreference {
  return {
    default_states: preferences.default_states,
    default_school_types: preferences.default_school_types,
    default_sectors: preferences.default_sectors,
    default_sort: preferences.default_sort,
    default_page_size: preferences.default_page_size,
    default_fee_min: preferences.default_fee_min,
    default_fee_max: preferences.default_fee_max,
  };
}

test.describe.configure({ mode: 'serial' });

test('en: settings tabs are URL-addressable and keyboard-operable; a removed tab falls back', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInAs(page, request, PARENT);
  await page.goto('/dashboard/settings?tab=auth');

  await expect(page.getByRole('tab')).toHaveCount(3);
  const authTab = page.getByRole('tab', { name: cat(en, 'Settings.tabs.auth') });
  const searchTab = page.getByRole('tab', { name: cat(en, 'Settings.tabs.search') });
  const notificationsTab = page.getByRole('tab', { name: cat(en, 'Settings.tabs.notifications') });
  await expect(authTab).toHaveAttribute('aria-selected', 'true');
  await authTab.press('ArrowRight');
  await expect(searchTab).toBeFocused();
  await searchTab.press('Enter');
  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=search$/);
  await expect(searchTab).toHaveAttribute('aria-selected', 'true');

  await searchTab.press('ArrowRight');
  await expect(notificationsTab).toBeFocused();
  await notificationsTab.press('Enter');
  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=notifications$/);
  await expect(notificationsTab).toHaveAttribute('aria-selected', 'true');

  // The children tab is gone; its old URL coerces to the default (auth) tab.
  await page.goto('/dashboard/settings?tab=children');
  await expect(authTab).toHaveAttribute('aria-selected', 'true');
  // The goto remounts the shell, so the rail and the tab panel are mid fade-in —
  // settle every running animation before axe samples contrast (a mid-fade frame
  // composites the ink below AA and fails hundreds of nodes).
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null)));
  });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blockers, 'settings tab accessibility').toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: search preferences write to the real API and survive a settings reload', async ({
  page,
  request,
}) => {
  const { jwt, preferences } = await readSearchPreferences(request);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);

  try {
    await page.goto('/dashboard/settings?tab=search');
    // The panel is now the sensible three: default states (ChoicePill group),
    // default sort (select) and results per page (segmented radiogroup).
    const states = page.getByRole('group', { name: cat(en, 'Settings.defaultStates') });
    await expect(states).toBeVisible();
    const queensland = states.getByRole('button', { name: 'QLD', exact: true });
    if ((await queensland.getAttribute('aria-pressed')) !== 'true') {
      await queensland.click();
    }
    await expect(queensland).toHaveAttribute('aria-pressed', 'true');

    const pageSizes = page.getByRole('radiogroup', { name: cat(en, 'Settings.defaultPageSize') });
    await pageSizes.getByRole('radio', { name: '24', exact: true }).click();

    const sort = page.getByRole('combobox', { name: cat(en, 'Settings.defaultSort') });
    await sort.click();
    await page
      .getByRole('option', { name: cat(en, 'SchoolSearch.sortOptions.nameDesc'), exact: true })
      .click();
    await expect(sort).toContainText(cat(en, 'SchoolSearch.sortOptions.nameDesc'));

    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/search-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, 'Settings.saveSearchPreferences') }).click();
    const update = await updatePromise;
    expect(update.status(), await update.text()).toBe(200);

    await page.reload();
    await expect(queensland).toHaveAttribute('aria-pressed', 'true');
    await expect(pageSizes.getByRole('radio', { name: '24', exact: true })).toBeChecked();
    await expect(sort).toContainText(cat(en, 'SchoolSearch.sortOptions.nameDesc'));
  } finally {
    const restore = await request.put(`${API_BASE_URL}/api/search-preferences/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: preferencePayload(preferences),
    });
    expect(restore.ok(), await restore.text()).toBeTruthy();
  }
});

test('en: authentication settings change and restore the dedicated seeded parent password', async ({
  page,
  request,
}) => {
  let changedJwt: string | null = null;
  await signInAs(page, request, SETTINGS_PARENT);
  // parent-t06 is onboarding-pending: the dashboard guard would yank the
  // settings screen to /onboarding mid-submit. Skip once via the real UI
  // (the skipped status persists, so this is a no-op gate on later runs).
  await skipOnboardingViaUi(page);

  try {
    await page.goto('/dashboard/settings?tab=auth');
    await page
      .getByRole('textbox', { name: cat(en, 'Auth.currentPasswordLabel'), exact: true })
      .fill(SETTINGS_PARENT.password);
    await page
      .getByRole('textbox', { name: cat(en, 'Auth.newPasswordLabel'), exact: true })
      .fill(CHANGED_PASSWORD);
    await page
      .getByRole('textbox', { name: cat(en, 'Auth.confirmPasswordLabel'), exact: true })
      .fill(CHANGED_PASSWORD);
    const changePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/auth/change-password') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: cat(en, 'Auth.updatePasswordButton') }).click();
    const change = await changePromise;
    expect(change.status(), await change.text()).toBe(200);
    changedJwt = ((await change.json()) as { jwt: string }).jwt;
  } finally {
    if (changedJwt) {
      const restore = await request.post(`${API_BASE_URL}/api/auth/change-password`, {
        headers: { Authorization: `Bearer ${changedJwt}` },
        data: {
          currentPassword: CHANGED_PASSWORD,
          password: SETTINGS_PARENT.password,
          passwordConfirmation: SETTINGS_PARENT.password,
        },
      });
      expect(restore.ok(), await restore.text()).toBeTruthy();
    }
  }

  const login = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: SETTINGS_PARENT.email, password: SETTINGS_PARENT.password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
});
