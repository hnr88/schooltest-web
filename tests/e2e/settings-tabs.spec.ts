import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
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

test('en: settings tabs are URL-addressable, keyboard-operable, and expose real child management', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInAs(page, request, PARENT);
  await page.goto('/dashboard/settings?tab=auth');

  const authTab = page.getByRole('tab', { name: cat(en, 'Settings.tabs.auth') });
  const searchTab = page.getByRole('tab', { name: cat(en, 'Settings.tabs.search') });
  await expect(authTab).toHaveAttribute('aria-selected', 'true');
  await authTab.press('ArrowRight');
  await expect(searchTab).toBeFocused();
  await searchTab.press('Enter');
  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=search$/);
  await expect(searchTab).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: cat(en, 'Settings.tabs.children') }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=children$/);
  await expect(page.getByRole('link', { name: cat(en, 'Settings.manageChildren') })).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: icu(cat(en, 'Children.viewProfileLabel'), { name: 'Mia Keller' }),
    }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blockers, 'settings children tab accessibility').toEqual([]);
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
    const queensland = page.getByRole('checkbox', { name: 'QLD' });
    const expectedChecked = !(await queensland.isChecked());
    await queensland.click();
    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/search-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, 'Settings.saveSearchPreferences') }).click();
    const update = await updatePromise;
    expect(update.status(), await update.text()).toBe(200);

    await page.reload();
    await expect(queensland).toBeChecked({ checked: expectedChecked });
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
