/**
 * D-009 regression: no teacher breadcrumb links to a route without a page.
 *
 * `trail.constants.ts` registers `/dashboard/teach/classes` and
 * `/dashboard/teach/results` as ancestors of the teacher record patterns, but
 * neither route has a `page.tsx` — only `classes/[documentId]` and
 * `results/[classId]` do, and `build-trail.ts` hands an `href` to every walked
 * segment.
 *
 * What saves these two pages TODAY is an accident, not a guarantee: nothing in
 * `modules/teach` publishes a record crumb, so the ancestor lands as the LAST
 * crumb and renders as text. Publish one — as every other detail page already
 * does — and it becomes a live link to a 404. The deterministic proof of that
 * condition is `src/modules/navigation/lib/build-trail.test.ts`, which supplies
 * `recordLabel` directly; this spec is the real-browser guard that the rendered
 * trail never links anywhere that 404s, whatever the record state.
 *
 * Status is read through `page.request`, NOT the bare `request` fixture: only
 * the page's context carries the session cookie, and an unauthenticated probe
 * of a dashboard route redirects to sign-in — which would answer 200 and hide
 * the very 404 this spec exists to catch.
 *
 * ONE sign-in for the whole file: the suite is serial and shares a single page
 * created in `beforeAll`. The API's brute-force guard is 20 POST
 * /api/auth/local per minute per IP and that budget is shared with every other
 * suite on this host, so this file must never cost more than one login.
 */
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { fixtureClassId } from './helpers/fixture-class';
import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const CAPTURES = '../.codephant/missions/msn-0da39441-f845-426b-88a1-037c9eb98442/captures';

/** The dashboard topbar trail. */
function trail(page: Page) {
  return page.getByRole('navigation', { name: en['Shell.topbar.breadcrumbLabel'] }).first();
}

/** Every href the trail actually renders, in DOM order. */
async function trailHrefs(page: Page): Promise<string[]> {
  return trail(page)
    .locator('a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
}

/** Every crumb label the trail renders, links and plain text alike. */
async function trailLabels(page: Page): Promise<string[]> {
  const texts = await trail(page).locator('li').allInnerTexts();
  return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0 && t !== '/');
}

/** Strip the locale prefix a next-intl <Link> adds, so paths compare to the registry. */
function localeless(href: string): string {
  return href.replace(/^\/[a-z]{2}(?=\/)/, '');
}

test.describe('D-009 — teacher breadcrumbs never link to a missing page', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;
  // Both record routes take the SAME id namespace (a class documentId), and the
  // ids resolve from the SEED by name through the shared fixtureClassId idiom —
  // real rows, never fabricated. (The previous source — scraping the teach
  // record hrefs off the teacher home — is retired DOM: scoring/10 (R-16) made
  // /dashboard/results the teacher home, and task 06's kit rows link the
  // /dashboard/results/<id> records, not the guarded /dashboard/teach ones.)
  const recordPath: Record<'classes' | 'results', string> = {
    classes: `/dashboard/teach/classes/${fixtureClassId()}`,
    results: `/dashboard/teach/results/${fixtureClassId()}`,
  };

  async function openRecord(surface: 'classes' | 'results'): Promise<string> {
    const path = recordPath[surface];
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
    return path;
  }

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await loginAs(page, 'teacher');
  });

  test.afterAll(async () => {
    await context?.close();
  });

  for (const surface of ['classes', 'results'] as const) {
    test(`every crumb on the teacher ${surface} record page resolves — none is a 404`, async () => {
      const path = await openRecord(surface);

      const hrefs = await trailHrefs(page);
      expect(hrefs.length, `${path}: the trail renders at least one link`).toBeGreaterThan(0);

      for (const href of hrefs) {
        const res = await page.request.get(href);
        expect(res.status(), `crumb ${href} on ${path} must not be a dead link`).toBe(200);
      }
    });
  }

  test('the Classes / Results ancestors keep their label but are not links', async () => {
    for (const [surface, label] of [
      ['classes', en['Shell.nav.classes']],
      ['results', en['Navigation.results']],
    ] as const) {
      const path = await openRecord(surface);

      // Labels yes: the level still shows in the hierarchy.
      expect(await trailLabels(page), `${path}: the ${label} level is still labelled`).toContain(
        label,
      );

      // Dead hrefs no: the ancestor's own path is never an anchor target.
      const deadPath = `/dashboard/teach/${surface}`;
      for (const href of await trailHrefs(page)) {
        expect(
          localeless(href),
          `${path}: ${deadPath} has no page, so no crumb may link to it`,
        ).not.toBe(deadPath);
      }
    }
  });

  test('capture: the teacher trail at desktop and 375px', async ({}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openRecord('classes');
    await trail(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${CAPTURES}/d009-breadcrumb-desktop.png` });
    testInfo.attach('d009-breadcrumb-desktop', {
      body: await page.screenshot({ clip: (await trail(page).boundingBox()) ?? undefined }),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await openRecord('classes');
    await page.screenshot({ path: `${CAPTURES}/d009-breadcrumb-375.png` });
    testInfo.attach('d009-breadcrumb-375', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // The trail must not push the page sideways at 375px (same rule the public
    // breadcrumb suite already enforces).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'horizontal overflow at 375px').toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 1440, height: 900 });
  });
});
