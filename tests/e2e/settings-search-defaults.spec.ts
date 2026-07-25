import { expect, test } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import { paceRateWindow } from './helpers/pace';
import { watchErrors } from './helpers/ui';

// Task 011: the saved search preferences are no longer write-only — saving
// default_states + default_sort + default_page_size in settings must seed the
// FIRST /dashboard/search render of the session. Driven end to end: save through
// the real form, then assert the corpus narrows to the seeded 74 QLD schools at
// 24 cards per page with the saved sort on the request wire. Originals restored
// in `finally` so the suite stays order-independent.
const en = loadMessages('en');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5510';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };

interface SearchPreference {
  default_states: string[];
  default_school_types: string[];
  default_sectors: string[];
  default_sort: string;
  default_page_size: number;
  default_fee_min: number | null;
  default_fee_max: number | null;
}

test.describe.configure({ mode: 'serial' });
test.beforeEach(async ({ page }) => paceRateWindow(page));

function preferencePayload(p: SearchPreference): SearchPreference {
  return {
    default_states: p.default_states,
    default_school_types: p.default_school_types,
    default_sectors: p.default_sectors,
    default_sort: p.default_sort,
    default_page_size: p.default_page_size,
    default_fee_min: p.default_fee_min,
    default_fee_max: p.default_fee_max,
  };
}

/** Resolves a `{count, plural, ...}` results-count key exactly as next-intl would. */
function resultsCount(count: number): string {
  const template = cat(en, 'SchoolSearch.resultsCount');
  const body = template.replace(/^\{\w+,\s*plural,\s*/, '').replace(/\}$/, '');
  const branches = new Map<string, string>();
  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) branches.set(match[1], match[2]);
  const branch =
    branches.get(`=${count}`) ??
    branches.get(new Intl.PluralRules('en').select(count)) ??
    branches.get('other') ??
    '';
  return branch.replace(/#/g, new Intl.NumberFormat('en').format(count));
}

test('en: saved search defaults apply to the first school search render', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  const login = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  const current = await request.get(`${API_BASE_URL}/api/search-preferences/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(current.ok(), await current.text()).toBeTruthy();
  const { data: original } = (await current.json()) as { data: SearchPreference };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);

  try {
    await page.goto('/dashboard/settings?tab=search');
    const states = page.getByRole('group', { name: cat(en, 'Settings.defaultStates') });
    const queensland = states.getByRole('button', { name: 'QLD', exact: true });
    await expect(queensland).toBeVisible();
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

    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/search-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, 'Settings.saveSearchPreferences') }).click();
    expect((await updatePromise).status()).toBe(200);

    // First search render of the session: the saved defaults must be on the wire.
    const seededSearch = page.waitForResponse((response) => {
      if (response.request().method() !== 'POST') return false;
      if (!response.url().endsWith('/api/search/schools')) return false;
      const body = response.request().postDataJSON() as {
        states?: string[];
        sortBy?: string;
        pageSize?: number;
      };
      return (
        body.states?.includes('QLD') === true &&
        body.sortBy === 'name-desc' &&
        body.pageSize === 24
      );
    });
    await page.goto('/dashboard/search');
    expect((await seededSearch).status()).toBe(200);

    await expect(page.getByText(resultsCount(74), { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-slot="school-card"]')).toHaveCount(24);
    await expect(
      page.getByRole('button', {
        name: icu(cat(en, 'SchoolSearch.filterPanel.remove'), { label: 'QLD' }),
      }),
    ).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    const restore = await request.put(`${API_BASE_URL}/api/search-preferences/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: preferencePayload(original),
    });
    expect(restore.ok(), await restore.text()).toBeTruthy();
  }
});

// The panel copy promises the defaults apply "every time you open School
// search" — so saving NEW defaults mid-session must re-seed the pane on the
// next SPA visit, without a full reload. Every navigation below is a shell
// link click (SPA), never `page.goto`: the zustand store survives, which is
// exactly the case the old one-shot `hasHydratedDefaults` latch got wrong.
test('en: re-saved search defaults re-apply on SPA return to school search', async ({
  page,
  request,
}) => {
  test.slow();
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  const login = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  const current = await request.get(`${API_BASE_URL}/api/search-preferences/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(current.ok(), await current.text()).toBeTruthy();
  const { data: original } = (await current.json()) as { data: SearchPreference };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);

  /** Leaves exactly `only` pressed in the Default states group. */
  async function setOnlyState(only: string): Promise<void> {
    const states = page.getByRole('group', { name: cat(en, 'Settings.defaultStates') });
    for (const button of await states.getByRole('button').all()) {
      const name = await button.textContent();
      const pressed = (await button.getAttribute('aria-pressed')) === 'true';
      if (name !== null && pressed !== (name.trim() === only)) await button.click();
    }
  }

  /** Saves the search tab and waits for the real PUT to land. */
  async function savePreferences(): Promise<void> {
    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/search-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, 'Settings.saveSearchPreferences') }).click();
    expect((await updatePromise).status()).toBe(200);
  }

  /** The NEXT search request whose body carries the given defaults. */
  function searchRequestWith(states: string[], sortBy: string, pageSize: number) {
    return page.waitForResponse((response) => {
      if (response.request().method() !== 'POST') return false;
      if (!response.url().endsWith('/api/search/schools')) return false;
      const body = response.request().postDataJSON() as {
        states?: string[];
        sortBy?: string;
        pageSize?: number;
      };
      return (
        states.every((state) => body.states?.includes(state)) &&
        body.sortBy === sortBy &&
        body.pageSize === pageSize
      );
    });
  }

  try {
    // Defaults A: QLD / 24 per page / name Z→A, saved through the real form.
    await page.goto('/dashboard/settings?tab=search');
    await setOnlyState('QLD');
    const pageSizes = page.getByRole('radiogroup', { name: cat(en, 'Settings.defaultPageSize') });
    await pageSizes.getByRole('radio', { name: '24', exact: true }).click();
    const sort = page.getByRole('combobox', { name: cat(en, 'Settings.defaultSort') });
    await sort.click();
    await page
      .getByRole('option', { name: cat(en, 'SchoolSearch.sortOptions.nameDesc'), exact: true })
      .click();
    await savePreferences();

    // SPA-open search: A applies (wire + QLD chip + 24 cards of 74 QLD schools).
    const seededA = searchRequestWith(['QLD'], 'name-desc', 24);
    await page.getByRole('link', { name: cat(en, 'Shell.nav.search'), exact: true }).click();
    await page.waitForURL('**/dashboard/search');
    expect((await seededA).status()).toBe(200);
    await expect(page.getByText(resultsCount(74), { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-slot="school-card"]')).toHaveCount(24);
    await expect(
      page.getByRole('button', {
        name: icu(cat(en, 'SchoolSearch.filterPanel.remove'), { label: 'QLD' }),
      }),
    ).toBeVisible();

    // Back to settings (SPA), save defaults B: NSW / 12 per page / name A→Z.
    await page.getByRole('link', { name: cat(en, 'Shell.nav.settings'), exact: true }).click();
    await page.waitForURL('**/dashboard/settings**');
    await page.getByRole('tab', { name: cat(en, 'Settings.tabs.search') }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings\?tab=search$/);
    await setOnlyState('NSW');
    await pageSizes.getByRole('radio', { name: '12', exact: true }).click();
    await sort.click();
    await page
      .getByRole('option', { name: cat(en, 'SchoolSearch.sortOptions.nameAsc'), exact: true })
      .click();
    await savePreferences();

    // SPA-return to search: B must re-seed the pane — NSW on the wire and as
    // the applied chip, the stale QLD chip gone, 12 cards of 72 NSW schools.
    const seededB = searchRequestWith(['NSW'], 'name-asc', 12);
    await page.getByRole('link', { name: cat(en, 'Shell.nav.search'), exact: true }).click();
    await page.waitForURL('**/dashboard/search');
    expect((await seededB).status()).toBe(200);
    await expect(page.getByText(resultsCount(72), { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-slot="school-card"]')).toHaveCount(12);
    await expect(
      page.getByRole('button', {
        name: icu(cat(en, 'SchoolSearch.filterPanel.remove'), { label: 'NSW' }),
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: icu(cat(en, 'SchoolSearch.filterPanel.remove'), { label: 'QLD' }),
      }),
    ).toHaveCount(0);
    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    const restore = await request.put(`${API_BASE_URL}/api/search-preferences/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: preferencePayload(original),
    });
    expect(restore.ok(), await restore.text()).toBeTruthy();
  }
});
