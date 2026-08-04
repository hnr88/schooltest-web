/**
 * Shared accessibility assertions for the ops onboarding sweep (mission
 * st-ops-onboarding). Split out of the spec so it stays under the 200-line cap.
 */
import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Zero serious/critical axe violations; moderate/minor are logged, not asserted. */
export async function expectAxeClean(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const advisories = results.violations.filter(
    (violation) => violation.impact === 'moderate' || violation.impact === 'minor',
  );
  if (advisories.length > 0) {
    console.log(
      `[axe ${label}] moderate/minor:`,
      advisories.map((v) => `${v.impact}:${v.id} ×${v.nodes.length}`).join(', '),
    );
  }
  expect(
    blockers.map((v) => `${v.impact}:${v.id} → ${v.nodes.map((n) => n.target).join(' | ')}`),
    label,
  ).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(fits, `${label}: scrollWidth exceeded innerWidth`).toBe(true);
}
