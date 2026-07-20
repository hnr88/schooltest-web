import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, icu, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 039 (depends on 038, 029): the C-UI-SEARCH-UNIFIED e2e gate. SUBSUMES the
// retired school-search.spec.ts navigation — the panes no longer have standalone
// routes. Real login (SEEDED_PARENT) → the live api on :5500 answers every
// POST /api/search/{schools,agents} with the seeded corpus (312 schools / 74 QLD /
// 1 Paterson, server-verified in 025). Counts + copy derive from the live catalogs
// so a copy/seed drift fails loud. Only the (Test 5) error case intercepts a route.
// Mode switch + agents corpus + redirects + service-enum pin live in the sibling
// unified-search-states.spec.ts; this file owns the schools journey, the reset-
// desync guard, axe and zh.
const en = loadMessages('en');
const zh = loadMessages('zh');
// Playwright runs from the web package; the mission's screenshot store is the
// repo-root .qa/screenshots/wave7 (where 038's live), one level up.
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots', 'wave7');
const DESKTOP = { width: 1280, height: 800 };
const KEYSTROKE_DELAY_MS = 50; // < the 300ms unified-bar debounce window
const SCHOOLS_PATH = '/api/search/schools';

/** Resolves a `{count, plural, ...}` results-count key exactly as next-intl would. */
function resultsCount(
  count: number,
  ns: 'SchoolSearch' | 'AgentSearch',
  locale: 'en' | 'zh' = 'en',
): string {
  const template = cat(locale === 'zh' ? zh : en, `${ns}.resultsCount`);
  const body = template.replace(/^\{\w+,\s*plural,\s*/, '').replace(/\}$/, '');
  const branches = new Map<string, string>();
  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) branches.set(match[1], match[2]);
  const branch =
    branches.get(`=${count}`) ??
    branches.get(new Intl.PluralRules(locale).select(count)) ??
    branches.get('other') ??
    '';
  return branch.replace(/#/g, new Intl.NumberFormat(locale).format(count));
}

const schoolCards = (page: Page) => page.locator('[data-slot="school-card"]');
const searchBar = (page: Page) =>
  page.getByLabel(cat(en, 'UnifiedSearch.searchPlaceholderSchools'));
const schoolsTab = (page: Page) =>
  page.getByRole('tab', { name: cat(en, 'UnifiedSearch.modeSchools'), exact: true });

async function expectAxeClean(page: Page, label: string): Promise<void> {
  // A client mode switch (router.replace) briefly clears <title> mid metadata swap;
  // wait for it to settle so axe never samples the transient empty-title window.
  await expect(page).toHaveTitle(/\S/);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blockers = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const advisories = violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor');
  if (advisories.length > 0) {
    console.log(`[axe ${label}]`, advisories.map((v) => `${v.impact}:${v.id}`).join(', '));
  }
  expect(
    blockers.map((v) => `${v.impact}:${v.id}`),
    label,
  ).toEqual([]);
}

test('schools: sidebar nav → default corpus, one-debounced request, chip filter, pagination', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);

  const postedQueries: (string | undefined)[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || new URL(request.url()).pathname !== SCHOOLS_PATH) return;
    postedQueries.push((request.postDataJSON() as { q?: string } | null)?.q);
  });

  // The sidebar has exactly ONE "Search" entry (the standalone pane links are gone).
  await loginAsParent(page);
  const searchLink = page.getByRole('link', { name: cat(en, 'Shell.nav.search'), exact: true });
  await expect(searchLink).toHaveCount(1);
  await searchLink.click();
  await page.waitForURL('**/dashboard/search**');
  expect(new URL(page.url()).pathname).toBe('/dashboard/search');

  // Default → Schools segment active, 312 schools render (12 cards on page 1).
  await expect(schoolsTab(page)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(resultsCount(312, 'SchoolSearch'))).toBeVisible();
  await expect(schoolCards(page)).toHaveCount(12);
  await expect(schoolCards(page).first().locator('h3')).toHaveText('A B Paterson College');
  await page.screenshot({
    path: path.join(SCREENSHOTS, '039-unified-schools.png'),
    fullPage: true,
  });

  // Debounce: 8 fast keystrokes collapse to exactly ONE settled "Paterson" POST.
  postedQueries.length = 0;
  const settled = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      new URL(r.url()).pathname === SCHOOLS_PATH &&
      (r.request().postDataJSON() as { q?: string })?.q === 'Paterson',
  );
  await searchBar(page).pressSequentially('Paterson', { delay: KEYSTROKE_DELAY_MS });
  expect((await settled).ok()).toBeTruthy();
  await expect(page.getByText(resultsCount(1, 'SchoolSearch'))).toBeVisible();
  await expect(schoolCards(page)).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 3, name: 'A B Paterson College' })).toBeVisible();
  await expect.poll(() => postedQueries.filter((q) => q === 'Paterson').length).toBe(1);
  expect(
    postedQueries.some(
      (q) => typeof q === 'string' && q !== 'Paterson' && 'Paterson'.startsWith(q),
    ),
  ).toBe(false);

  // Clear q + QLD chip → count drops to 74, chip aria-pressed=true.
  await searchBar(page).fill('');
  const qld = page.getByRole('button', { name: cat(en, 'SchoolSearch.states.QLD'), exact: true });
  await qld.click();
  await expect(page.getByText(resultsCount(74, 'SchoolSearch'))).toBeVisible();
  await expect(qld).toHaveAttribute('aria-pressed', 'true');

  // Reload clears the in-memory store → page 2 differs, "Showing 13–24 of 312".
  await page.reload();
  await expect(page.getByText(resultsCount(312, 'SchoolSearch'))).toBeVisible();
  const firstOnPage1 = await schoolCards(page).first().locator('h3').textContent();
  await page.getByRole('button', { name: cat(en, 'Search.nextPage'), exact: true }).click();
  await expect(
    page.getByText(icu(cat(en, 'Search.showing'), { from: '13', to: '24', total: '312' })),
  ).toBeVisible();
  expect(await schoolCards(page).first().locator('h3').textContent()).not.toBe(firstOnPage1);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('reset-desync guard (W6): empty-state "Reset filters" clears the unified search bar', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page);
  await page.goto('/dashboard/search');
  await expect(schoolCards(page).first()).toBeVisible();

  // A nonsense q → §13.5 empty state; its "Reset filters" resets the store to q:''.
  await searchBar(page).fill('zzzzqqqq');
  await expect(page.locator('[data-slot="search-empty-state"]')).toBeVisible();
  await expect(page.getByText(cat(en, 'SchoolSearch.empty.title'))).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '039-unified-empty.png'), fullPage: true });

  await page.getByRole('button', { name: cat(en, 'Search.resetFilters'), exact: true }).click();
  // The bar REFLECTS the store q, so the store reset clears the input (the W6 fix)…
  await expect(searchBar(page)).toHaveValue('');
  // …and the full 312 corpus returns.
  await expect(page.getByText(resultsCount(312, 'SchoolSearch'))).toBeVisible();
});

test('axe: both modes have zero serious/critical violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // keep contrast sampling out of the fade
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page);
  await page.goto('/dashboard/search');
  await expect(page.getByText(resultsCount(312, 'SchoolSearch'))).toBeVisible();
  await expectAxeClean(page, '/dashboard/search?mode=schools @ 1280px');

  await page.getByRole('tab', { name: cat(en, 'UnifiedSearch.modeAgents'), exact: true }).click();
  await page.waitForURL('**mode=agents**');
  await expect(page.getByText(resultsCount(8, 'AgentSearch'))).toBeVisible();
  await expectAxeClean(page, '/dashboard/search?mode=agents @ 1280px');
});

test('zh: /zh/dashboard/search renders the zh catalog title in both modes', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page); // sign-in copy is en; navigate to the localized search route after auth
  await page.goto('/zh/dashboard/search');
  await expect(
    page.getByRole('heading', { level: 1, name: cat(zh, 'UnifiedSearch.titleSchools') }),
  ).toBeVisible();
  await expect(schoolCards(page).first()).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '039-unified-zh.png'), fullPage: true });

  await page.getByRole('tab', { name: cat(zh, 'UnifiedSearch.modeAgents'), exact: true }).click();
  await page.waitForURL('**mode=agents**');
  await expect(
    page.getByRole('heading', { level: 1, name: cat(zh, 'UnifiedSearch.titleAgents') }),
  ).toBeVisible();
});

// D-SEARCH-PREF: a saved Search-pref (`default_states:['QLD']`) must pre-filter the
// first Schools render to QLD. Search-prefs (086) + the seeding wiring (087) land in
// later waves, so this leg is OWNED by 087's settings-tabs.spec.ts, NOT this W7 spec.
test.fixme('schools first render is pre-filtered to a saved QLD Search-pref (D-SEARCH-PREF → 087)', () => {});
