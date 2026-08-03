/**
 * SEO e2e helpers (mission task 218). The public/private path lists are read
 * from the SAME source the app builds robots/llms/sitemap from, so the spec
 * cannot drift from the implementation it is checking.
 */
import type { Locator, Page } from '@playwright/test';

// Imported from the module's constants file rather than its barrel ON PURPOSE:
// the seo barrel re-exports React Server Components, and pulling those into a
// metadata route (or into the Node-side e2e runtime) drags next-intl's client
// navigation in with them. `.claude/rules/module-pattern.md` scopes the
// barrel-only rule to `src/modules/**`; these are route and test files.
import { DISALLOWED_PATHS, PUBLIC_ROUTES } from '@/modules/seo/constants/public-routes';
import { LEGAL_ROUTES } from '@/modules/legal/constants/legal.constants';

/** Every indexable public path: the registry plus the four legal routes. */
export const PUBLIC_PATHS: readonly string[] = [
  ...PUBLIC_ROUTES.map((route) => route.pathname),
  ...Object.values(LEGAL_ROUTES),
];

export const DISALLOWED_IN_ROBOTS: readonly string[] = [...DISALLOWED_PATHS];

/** Parse every JSON-LD block on the page; a malformed block throws loudly. */
export async function parseJsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((raw, index) => {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`[e2e] JSON-LD block ${index} is not valid JSON: ${String(error)}`);
    }
  });
}

/** Whitespace-normalised text of a locator — used to compare crumbs to JSON-LD. */
export async function textOf(locator: Locator): Promise<string> {
  return (await locator.innerText()).replace(/\s+/g, ' ').trim();
}
