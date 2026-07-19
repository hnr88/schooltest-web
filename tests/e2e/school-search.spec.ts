import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, icu, loadMessages, stripTags } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 035 (depends on 034, 025): the C-UI-SEARCH-SCHOOLS e2e verification gate.
// Real login (SEEDED_PARENT) → sidebar nav → the live api on :5500 answers every
// POST /api/search/schools with the seeded corpus (312 schools / 74 QLD / 1
// "Paterson", server-verified in 025). Counts, tuition and pagination copy are
// derived from the live catalogs + Intl (never hardcoded), so a copy/seed drift
// fails loud. Only the (f) error case intercepts the route — every other state
// is real network truth.
const en = loadMessages('en');
const zh = loadMessages('zh');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };
const KEYSTROKE_DELAY_MS = 50; // < the 300ms SchoolSearchInput debounce window
const SEARCH_PATH = '/api/search/schools';

/** Resolves SchoolSearch.resultsCount for `count` exactly as next-intl would. */
function resultsCount(count: number, locale: 'en' | 'zh' = 'en'): string {
  const template = cat(locale === 'zh' ? zh : en, 'SchoolSearch.resultsCount');
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

/** The SchoolCard tuition footer the component renders (t.rich markup stripped). */
function tuitionText(amount: number): string {
  const formatted = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
  return icu(stripTags(cat(en, 'SchoolSearch.card.tuition')), { amount: formatted });
}

const cards = (page: Page) => page.locator('[data-slot="school-card"]');
const searchInput = (page: Page) => page.getByLabel(cat(en, 'SchoolSearch.searchLabel'));

async function login(page: Page): Promise<void> {
  await loginAsParent(page);
  await page.goto('/dashboard/search/schools');
  await expect(cards(page).first()).toBeVisible();
}

async function expectAxeClean(page: Page, label: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blockers = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const advisories = violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor');
  if (advisories.length > 0) {
    console.log(`[axe ${label}] moderate/minor:`, advisories.map((v) => `${v.impact}:${v.id}`).join(', '));
  }
  expect(
    blockers.map((v) => `${v.impact}:${v.id} → ${v.nodes.map((n) => n.target).join(' | ')}`),
    label,
  ).toEqual([]);
}

test('en: sidebar nav, corpus renders, one-debounced request, chip filter, pagination', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);

  // Record every real POST /api/search/schools by its `q` for the debounce proof.
  const postedQueries: (string | undefined)[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || new URL(request.url()).pathname !== SEARCH_PATH) return;
    postedQueries.push((request.postDataJSON() as { q?: string } | null)?.q);
  });

  // Step 2: real login → navigate via the sidebar link (label from the live catalog).
  await loginAsParent(page);
  await page.getByRole('link', { name: cat(en, 'Shell.nav.schoolSearch'), exact: true }).click();
  await page.waitForURL('**/dashboard/search/schools');
  await expect(page.getByRole('heading', { level: 1, name: cat(en, 'SchoolSearch.title') })).toBeVisible();

  // (a) seeded corpus: "312 results" with no filters, page 1 shows 12 cards.
  await expect(page.getByText(resultsCount(312))).toBeVisible();
  await expect(cards(page)).toHaveCount(12);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'school-search-desktop-en.png'), fullPage: true });

  // (b) debounce: 8 fast keystrokes collapse to exactly ONE settled "Paterson" POST.
  postedQueries.length = 0;
  const settled = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      new URL(r.url()).pathname === SEARCH_PATH &&
      (r.request().postDataJSON() as { q?: string })?.q === 'Paterson',
  );
  await searchInput(page).pressSequentially('Paterson', { delay: KEYSTROKE_DELAY_MS });
  expect((await settled).ok()).toBeTruthy();
  await expect(page.getByText(resultsCount(1))).toBeVisible();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 3, name: 'A B Paterson College' })).toBeVisible();
  await expect(cards(page).first()).toContainText(tuitionText(30000));
  await expect.poll(() => postedQueries.filter((q) => q === 'Paterson').length).toBe(1);
  expect(postedQueries.some((q) => typeof q === 'string' && q !== 'Paterson' && 'Paterson'.startsWith(q))).toBe(false);

  // (c) clear q + QLD chip → "74 results", chip aria-pressed=true (solid/active).
  await searchInput(page).fill('');
  const qld = page.getByRole('button', { name: cat(en, 'SchoolSearch.states.QLD'), exact: true });
  await qld.click();
  await expect(page.getByText(resultsCount(74))).toBeVisible();
  await expect(qld).toHaveAttribute('aria-pressed', 'true');

  // (d) reset (reload clears the in-memory store) → page 2 differs, "Showing 13–24 of 312".
  await page.reload();
  await expect(page.getByText(resultsCount(312))).toBeVisible();
  const firstOnPage1 = await cards(page).first().locator('h3').textContent();
  await page.getByRole('button', { name: cat(en, 'Search.nextPage'), exact: true }).click();
  await expect(page.getByText(icu(cat(en, 'Search.showing'), { from: '13', to: '24', total: '312' }))).toBeVisible();
  expect(await cards(page).first().locator('h3').textContent()).not.toBe(firstOnPage1);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: nonsense query empty state resets, intercepted 500 shows Alert + retry recovers', async ({ page }) => {
  test.setTimeout(60_000); // the query retries a 500 three times (default backoff) before isError
  await page.setViewportSize(DESKTOP);
  await login(page);

  // (e) nonsense query → empty state with reset CTA; reset restores the 312 corpus.
  await searchInput(page).fill('zzzzqqqq');
  await expect(page.locator('[data-slot="search-empty-state"]')).toBeVisible();
  await expect(page.getByText(cat(en, 'SchoolSearch.empty.title'))).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'school-search-empty-en.png'), fullPage: true });
  await page.getByRole('button', { name: cat(en, 'Search.resetFilters'), exact: true }).click();
  await expect(page.getByText(resultsCount(312))).toBeVisible();

  // (f) error state via route interception → Alert + retry; unroute + retry recovers the grid.
  await page.route(`**${SEARCH_PATH}`, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, error: { status: 500, name: 'InternalServerError', message: 'boom' } }),
    }),
  );
  await page.reload();
  await expect(page.getByText(cat(en, 'SchoolSearch.error.title'))).toBeVisible({ timeout: 30_000 });
  const retry = page.getByRole('button', { name: cat(en, 'SchoolSearch.error.retry'), exact: true });
  await expect(retry).toBeVisible();
  await page.unroute(`**${SEARCH_PATH}`);
  await retry.click();
  await expect(page.getByText(resultsCount(312))).toBeVisible();
  await expect(cards(page).first()).toBeVisible();
});

test('mobile 375: sidebar hidden, hamburger present, results render', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(MOBILE);
  await login(page);
  await expect(page.getByRole('heading', { level: 1, name: cat(en, 'SchoolSearch.title') })).toBeVisible();
  await expect(page.getByRole('button', { name: cat(en, 'Shell.topbar.openNav'), exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: cat(en, 'Shell.nav.schoolSearch'), exact: true })).toHaveCount(0);
  await expect(page.getByText(resultsCount(312))).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'school-search-mobile-en.png'), fullPage: true });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('axe: results grid has zero serious/critical violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // keep color-contrast sampling out of the fade
  await page.setViewportSize(DESKTOP);
  await login(page);
  await expect(page.getByText(resultsCount(312))).toBeVisible();
  await expectAxeClean(page, '/dashboard/search/schools @ 1280px');
});

test('zh: catalog renders — h1 from zh.json', async ({ page, context, baseURL }) => {
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page); // sign-in copy is en; switch locale after auth
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'zh', url: baseURL ?? 'http://localhost:3100' }]);
  await page.goto('/dashboard/search/schools');
  await expect(page.getByRole('heading', { level: 1, name: cat(zh, 'SchoolSearch.title') })).toBeVisible();
  await expect(cards(page).first()).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'school-search-zh.png'), fullPage: true });
});
