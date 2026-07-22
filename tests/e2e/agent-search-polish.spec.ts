import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');
const AGENTS_PATH = '/api/search/agents';
const agentCards = (page: import('@playwright/test').Page) => page.locator('[data-slot="agent-card"]');

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
