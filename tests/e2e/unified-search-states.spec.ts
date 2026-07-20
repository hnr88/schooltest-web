import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, escapeRegExp, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 039, part 2 (see unified-search.spec.ts): the C-UI-SEARCH-UNIFIED mode
// switch (?mode persistence), the agents corpus (C-UI-SEARCH-AGENTS), the C10
// service-enum network pin, the 308→unified redirects for the retired standalone
// routes, and the schools error state. Everything is real network truth against
// the live api on :5500 except the (final) intercepted 500.
const en = loadMessages('en');
// Repo-root .qa/screenshots/wave7 (Playwright runs from the web package, one down).
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots', 'wave7');
const DESKTOP = { width: 1280, height: 800 };
const AGENTS_PATH = '/api/search/agents';
const SCHOOLS_PATH = '/api/search/schools';

/** Both panes share the `{count, plural, one {# result} other {# results}}` key. */
function resultsCount(count: number, ns: 'SchoolSearch' | 'AgentSearch'): string {
  const template = cat(en, `${ns}.resultsCount`);
  const body = template.replace(/^\{\w+,\s*plural,\s*/, '').replace(/\}$/, '');
  const branches = new Map<string, string>();
  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) branches.set(match[1], match[2]);
  const branch = branches.get(`=${count}`) ?? branches.get(count === 1 ? 'one' : 'other') ?? '';
  return branch.replace(/#/g, String(count));
}

const agentCards = (page: Page) => page.locator('[data-slot="agent-card"]');
const schoolCards = (page: Page) => page.locator('[data-slot="school-card"]');
const tab = (page: Page, key: 'modeSchools' | 'modeAgents') =>
  page.getByRole('tab', { name: cat(en, `UnifiedSearch.${key}`), exact: true });

async function gotoSearch(page: Page): Promise<void> {
  await loginAsParent(page);
  await page.goto('/dashboard/search');
  await expect(schoolCards(page).first()).toBeVisible();
}

test('mode switch persists to ?mode; agents corpus renders verified, no pagination, bar empty', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await gotoSearch(page);

  // Click the Agents segment → URL gains ?mode=agents, 8 verified agents render.
  await tab(page, 'modeAgents').click();
  await page.waitForURL('**mode=agents**');
  expect(new URL(page.url()).searchParams.get('mode')).toBe('agents');
  await expect(tab(page, 'modeAgents')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(resultsCount(8, 'AgentSearch'))).toBeVisible();
  await expect(agentCards(page)).toHaveCount(8);
  await expect(agentCards(page).first().locator('h3')).toHaveText('Pacific Bridge Education');
  const verifiedBadges = page.getByText(cat(en, 'AgentSearch.verified'), { exact: true });
  await expect(verifiedBadges).toHaveCount(8); // every seeded agent is Verified
  // Single page of results → the pagination footer is absent.
  await expect(page.getByRole('navigation', { name: cat(en, 'Search.paginationLabel') })).toHaveCount(0);
  // The unified bar reflects the (empty) agents store q, not the schools q.
  await expect(page.getByLabel(cat(en, 'UnifiedSearch.searchPlaceholderAgents'))).toHaveValue('');
  await page.screenshot({ path: path.join(SCREENSHOTS, '039-unified-agents.png'), fullPage: true });

  // Switch back → ?mode=schools, the schools grid returns.
  await tab(page, 'modeSchools').click();
  await page.waitForURL('**mode=schools**');
  await expect(tab(page, 'modeSchools')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(resultsCount(312, 'SchoolSearch'))).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});

test('agents service-enum pin (C10): a service chip sends the schema enum; name_desc sort reorders', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page);

  // Record the `services` array on every real agent-search POST.
  const postedServices: unknown[][] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || new URL(request.url()).pathname !== AGENTS_PATH) return;
    const body = request.postDataJSON() as { services?: unknown[] } | null;
    if (body?.services) postedServices.push(body.services);
  });

  await page.goto('/dashboard/search?mode=agents');
  await expect(agentCards(page).first()).toBeVisible();

  // Click the Visa service chip → the settled request body carries the SCHEMA enum
  // "visa" — a payload with a legacy string (school_placement / visa_assistance) is
  // the C10 regression.
  const visaRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      new URL(request.url()).pathname === AGENTS_PATH &&
      Boolean((request.postDataJSON() as { services?: string[] } | null)?.services?.includes('visa')),
  );
  await page
    .getByRole('button', { name: cat(en, 'AgentSearch.filterPanel.trigger'), exact: true })
    .click();
  await page
    .locator('[data-slot="popover-content"]')
    .getByRole('button', { name: cat(en, 'AgentSearch.services.visa'), exact: true })
    .click();
  const body = (await visaRequest).postDataJSON() as { services: string[] };
  expect(body.services).toContain('visa');
  expect(body.services).not.toContain('school_placement');
  expect(body.services).not.toContain('visa_assistance');
  await expect(agentCards(page).first()).toBeVisible();
  expect(postedServices.every((services) => !services.includes('school_placement'))).toBe(true);

  // Sort Z→A: the first card flips to the last-alphabetical seeded agent.
  await page.getByRole('button', { name: new RegExp(escapeRegExp(cat(en, 'AgentSearch.sort.label'))) }).click();
  await page.getByRole('menuitemradio', { name: cat(en, 'AgentSearch.sortOptions.name_desc') }).click();
  await expect(agentCards(page).first().locator('h3')).toHaveText('Seoul Global Pathways');
});

/**
 * Assert the retired standalone route issues a PERMANENT (308) redirect to the unified
 * pane. C-UI-SEARCH-UNIFIED mandates `permanentRedirect()` in a server component and
 * FORBIDS a middleware/proxy or next.config `redirects()` layer ("NO middleware/proxy —
 * C-UI-SHELL forbids one"). Under the root layout's streaming next/font preload `link:`
 * headers (which commit HTTP 200 before the page throws), Next emits the 308 as an RSC
 * redirect *directive* in the body rather than a transport `308 + Location`. This assert
 * proves the 308 + target either way — a real transport 308 (if a future config layer
 * ever lands) OR the RSC `;308` directive the current contract-compliant page emits.
 */
async function expect308Redirect(page: Page, from: string, mode: 'schools' | 'agents'): Promise<void> {
  const target = `/dashboard/search?mode=${mode}`;
  const res = await page.request.get(from, { maxRedirects: 0 });
  if (res.status() === 308) {
    expect(res.headers()['location']).toContain(target); // transport 308 (config layer)
  } else {
    expect(res.status()).toBe(200); // permanentRedirect under the font-streaming layout
    expect(await res.text()).toContain(`NEXT_REDIRECT;replace;${target};308`);
  }
}

test('redirects: retired standalone routes 308-permanent-redirect into the matching unified pane; deep-link opens agents', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page);

  // Transport proof: each retired route carries a 308 permanent redirect to its pane.
  await expect308Redirect(page, '/dashboard/search/schools', 'schools');
  await expect308Redirect(page, '/dashboard/search/agents', 'agents');

  // Functional proof: /dashboard/search/schools → unified shell on the Schools pane.
  await page.goto('/dashboard/search/schools');
  await page.waitForURL((url) => url.pathname === '/dashboard/search' && url.searchParams.get('mode') === 'schools');
  await expect(tab(page, 'modeSchools')).toHaveAttribute('aria-selected', 'true');
  await expect(schoolCards(page).first()).toBeVisible();

  // /dashboard/search/agents → unified shell on the Agents pane.
  await page.goto('/dashboard/search/agents');
  await page.waitForURL((url) => url.pathname === '/dashboard/search' && url.searchParams.get('mode') === 'agents');
  await expect(tab(page, 'modeAgents')).toHaveAttribute('aria-selected', 'true');
  await expect(agentCards(page).first()).toBeVisible();

  // Deep-link ?mode=agents opens directly on the Agents pane.
  await page.goto('/dashboard/search?mode=agents');
  await expect(tab(page, 'modeAgents')).toHaveAttribute('aria-selected', 'true');
  await expect(agentCards(page).first()).toBeVisible();
});

test('schools error: intercepted 500 shows the Alert + retry, unroute recovers the grid', async ({
  page,
}) => {
  test.setTimeout(60_000); // the query retries a 500 three times before isError
  await page.setViewportSize(DESKTOP);
  await gotoSearch(page);

  await page.route(`**${SCHOOLS_PATH}`, (route) =>
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

  await page.unroute(`**${SCHOOLS_PATH}`);
  await retry.click();
  await expect(page.getByText(resultsCount(312, 'SchoolSearch'))).toBeVisible();
  await expect(schoolCards(page).first()).toBeVisible();
});
