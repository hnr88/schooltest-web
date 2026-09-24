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

/** Every indexable public path: the registry plus the four legal CMS pages. */
const LEGAL_PATHS = ['/privacy-policy', '/terms-of-service', '/cookie-policy', '/gdpr'] as const;

export const PUBLIC_PATHS: readonly string[] = [
  ...PUBLIC_ROUTES.map((route) => route.pathname),
  ...LEGAL_PATHS,
];

export const DISALLOWED_IN_ROBOTS: readonly string[] = [...DISALLOWED_PATHS];

/**
 * Parse every JSON-LD block on the page and flatten each `@graph` into its
 * nodes, so a spec sees one list of typed nodes however the page groups them.
 * A malformed block throws loudly.
 */
export async function parseJsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((raw, index) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`[e2e] JSON-LD block ${index} is not valid JSON: ${String(error)}`);
    }
    const graph = parsed['@graph'];
    return Array.isArray(graph) ? (graph as Record<string, unknown>[]) : [parsed];
  });
}

/** A node's `@type` as a list (schema.org allows a single type or several). */
export function typesOf(node: Record<string, unknown>): string[] {
  const type = node['@type'];
  return Array.isArray(type) ? type.map(String) : [String(type)];
}

/** Whitespace-normalised text of a locator — used to compare crumbs to JSON-LD. */
export async function textOf(locator: Locator): Promise<string> {
  return (await locator.innerText()).replace(/\s+/g, ' ').trim();
}
