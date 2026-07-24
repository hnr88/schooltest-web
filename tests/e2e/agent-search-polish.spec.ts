import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { paceRateWindow } from './helpers/pace';

const en = loadMessages('en');
const AGENTS_PATH = '/api/search/agents';
const agentCards = (page: import('@playwright/test').Page) => page.locator('[data-slot="agent-card"]');

// Global API limiter headroom (120 req/min): pace each test — see helpers/pace.ts.
test.beforeEach(async ({ page }) => paceRateWindow(page));

/** Resolves the shared `{count, plural, one {# result} other {# results}}` catalog key. */
function resultsCount(count: number): string {
  const template = cat(en, 'AgentSearch.resultsCount');
  const body = template.replace(/^\{\w+,\s*plural,\s*/, '').replace(/\}$/, '');
  const branches = new Map<string, string>();
  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) branches.set(match[1], match[2]);
  const branch = branches.get(`=${count}`) ?? branches.get(count === 1 ? 'one' : 'other') ?? '';
  return branch.replace(/#/g, String(count));
}

/** Waits for the settled agent-search POST carrying exactly this request payload field. */
function waitForAgentsQuery(page: import('@playwright/test').Page, q: string) {
  return page.waitForResponse((candidate) => {
    if (candidate.request().method() !== 'POST') return false;
    if (new URL(candidate.url()).pathname !== AGENTS_PATH) return false;
    return (candidate.request().postDataJSON() as { q?: string }).q === q;
  });
}

test('agent search: a relevant real query and grouped filters return polished verified cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAsParent(page);
  await page.goto('/dashboard/search?mode=agents');

  const query = page.getByLabel(cat(en, 'UnifiedSearch.searchPlaceholderAgents'));
  const queryResponse = page.waitForResponse((candidate) => {
    if (candidate.request().method() !== 'POST') return false;
    if (new URL(candidate.url()).pathname !== AGENTS_PATH) return false;
    return (candidate.request().postDataJSON() as { q?: string }).q === 'Pacific';
  });
  await query.fill('Pacific');
  expect((await queryResponse).ok()).toBeTruthy();
  await expect(agentCards(page)).toHaveCount(1);
  await expect(agentCards(page).first().getByRole('heading', { name: 'Pacific Bridge Education' })).toBeVisible();
  await expect(agentCards(page).first().locator('[data-slot="agent-card-profile"]')).toBeVisible();

  await query.fill('');
  // The agents filters open in the SAME §8.6 "All filters" overlay the schools pane
  // uses (the popover this asserted is gone) — one page, one filter surface.
  await page
    .getByRole('button', { name: cat(en, 'AgentSearch.filterPanel.trigger'), exact: true })
    .click();
  const panel = page.getByRole('dialog');
  await expect(panel).toBeVisible();
  for (const key of ['countries', 'languages', 'services'] as const) {
    await expect(panel.getByRole('heading', { name: cat(en, `AgentSearch.filterPanel.${key}`) })).toBeVisible();
  }

  const visa = panel.getByRole('button', { name: cat(en, 'AgentSearch.services.visa'), exact: true });
  const filterResponse = page.waitForResponse((candidate) => {
    if (candidate.request().method() !== 'POST') return false;
    if (new URL(candidate.url()).pathname !== AGENTS_PATH) return false;
    return (candidate.request().postDataJSON() as { services?: string[] }).services?.includes('visa') ?? false;
  });
  await visa.click();
  expect((await filterResponse).ok()).toBeTruthy();
  await expect(visa).toHaveAttribute('aria-pressed', 'true');

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map((violation) => `${violation.impact}:${violation.id}`),
  ).toEqual([]);
});

// Task 008 (C): the agent mission flow as a REAL round-trip — the seeded corpus is 8
// verified agents (all carry counselling/application/visa/scholarship/under18_welfare;
// none carry english_prep/accommodation, API-verified), so q and the service chips
// must move the count and clearing must restore it.
test('agent search round-trip: q narrows the 8-agent corpus, a service chip empties it, clearing restores', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAsParent(page);
  await page.goto('/dashboard/search?mode=agents');
  await expect(agentCards(page)).toHaveCount(8);
  await expect(page.getByText(resultsCount(8))).toBeVisible();

  const query = page.getByLabel(cat(en, 'UnifiedSearch.searchPlaceholderAgents'));

  // q round-trip: 'Pacific' → exactly 1 card; a nonsense q → the agents empty state.
  const pacificResponse = waitForAgentsQuery(page, 'Pacific');
  await query.fill('Pacific');
  expect((await pacificResponse).ok()).toBeTruthy();
  await expect(page.getByText(resultsCount(1))).toBeVisible();
  await expect(agentCards(page)).toHaveCount(1);
  await expect(
    agentCards(page).first().getByRole('heading', { name: 'Pacific Bridge Education' }),
  ).toBeVisible();

  const nonsenseResponse = waitForAgentsQuery(page, 'zzzzqqqq');
  await query.fill('zzzzqqqq');
  expect((await nonsenseResponse).ok()).toBeTruthy();
  await expect(agentCards(page)).toHaveCount(0);
  await expect(page.getByText(cat(en, 'AgentSearch.empty.title'))).toBeVisible();

  // Clearing q restores the full 8-agent corpus (same query key as the initial load,
  // so this can be a cache serve — assert the UI, not a network call).
  await query.fill('');
  await expect(page.getByText(resultsCount(8))).toBeVisible();
  await expect(agentCards(page)).toHaveCount(8);

  // Filter round-trip: no seeded agent offers English preparation → 0 results and the
  // empty state; "Clear all" from the overlay restores the 8.
  await page
    .getByRole('button', { name: cat(en, 'AgentSearch.filterPanel.trigger'), exact: true })
    .click();
  const panel = page.getByRole('dialog');
  await expect(panel).toBeVisible();
  const englishPrep = panel.getByRole('button', {
    name: cat(en, 'AgentSearch.services.english_prep'),
    exact: true,
  });
  const filterResponse = page.waitForResponse((candidate) => {
    if (candidate.request().method() !== 'POST') return false;
    if (new URL(candidate.url()).pathname !== AGENTS_PATH) return false;
    return (
      (candidate.request().postDataJSON() as { services?: string[] }).services?.includes(
        'english_prep',
      ) ?? false
    );
  });
  await englishPrep.click();
  expect((await filterResponse).ok()).toBeTruthy();
  await expect(englishPrep).toHaveAttribute('aria-pressed', 'true');
  await expect(agentCards(page)).toHaveCount(0);
  await expect(page.getByText(cat(en, 'AgentSearch.empty.title'))).toBeVisible();

  await panel
    .getByRole('button', { name: cat(en, 'AgentSearch.filterPanel.clear'), exact: true })
    .click();
  await expect(englishPrep).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText(resultsCount(8))).toBeVisible();
  await expect(agentCards(page)).toHaveCount(8);
});
