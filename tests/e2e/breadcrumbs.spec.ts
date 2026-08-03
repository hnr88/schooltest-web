/**
 * Mission st-legal-seo-ops E2E flows 7–13 and 20 (task 212): breadcrumbs
 * everywhere — public pages, legal pages, settings, the ops console, and deep
 * nested dashboard routes — with the JSON-LD trail matching the visible one.
 *
 * Dashboard assertions sign in through the REAL form with the seeded accounts.
 * No account is ever created through the UI.
 */
import { expect, test, type Page } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { parseJsonLd, textOf } from './helpers/seo';

const en = loadMessages('en');

const PUBLIC_TRAILS: readonly { path: string; crumbs: string[] }[] = [
  { path: '/', crumbs: [en['Navigation.home']] },
  { path: '/eald', crumbs: [en['Navigation.home'], en['Navigation.eald']] },
  { path: '/eald/diagnose', crumbs: [en['Navigation.home'], en['Navigation.eald'], en['Eald.nav.diagnose']] },
  { path: '/eald/teach', crumbs: [en['Navigation.home'], en['Navigation.eald'], en['Eald.nav.teach']] },
  { path: '/eald/track', crumbs: [en['Navigation.home'], en['Navigation.eald'], en['Eald.nav.track']] },
  { path: '/eald/predict', crumbs: [en['Navigation.home'], en['Navigation.eald'], en['Eald.nav.predict']] },
  { path: '/privacy-policy', crumbs: [en['Navigation.home'], en['Navigation.privacyPolicy']] },
  { path: '/terms-of-service', crumbs: [en['Navigation.home'], en['Navigation.termsOfService']] },
  { path: '/cookie-policy', crumbs: [en['Navigation.home'], en['Navigation.cookiePolicy']] },
  { path: '/gdpr', crumbs: [en['Navigation.home'], en['Navigation.gdpr']] },
];

/** Visible crumb labels, in DOM order, from a breadcrumb nav. */
async function crumbLabels(page: Page, label: string): Promise<string[]> {
  const items = page.getByRole('navigation', { name: label }).first().locator('li');
  const texts = await items.allInnerTexts();
  return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0 && t !== '/');
}

test.describe('public breadcrumbs', () => {
  for (const { path, crumbs } of PUBLIC_TRAILS) {
    test(`flow: ${path} shows the correct hierarchy`, async ({ page }) => {
      await page.goto(path);
      expect(await crumbLabels(page, en['Navigation.breadcrumbLabel'])).toEqual(crumbs);
    });
  }

  test('flow: every crumb link resolves — no crumb points at a missing page', async ({
    page,
    request,
  }) => {
    for (const { path } of PUBLIC_TRAILS) {
      await page.goto(path);
      const hrefs = await page
        .getByRole('navigation', { name: en['Navigation.breadcrumbLabel'] })
        .first()
        .locator('a[href]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

      for (const href of hrefs) {
        const res = await request.get(href);
        expect(res.status(), `crumb ${href} on ${path}`).toBe(200);
      }
    }
  });

  test('flow: the JSON-LD trail matches the visible trail exactly', async ({ page }) => {
    for (const { path, crumbs } of PUBLIC_TRAILS) {
      await page.goto(path);
      const nodes = await parseJsonLd(page);
      const list = nodes.find((node) => node['@type'] === 'BreadcrumbList') as {
        itemListElement: { position: number; name: string }[];
      };
      const names = list.itemListElement
        .sort((a, b) => a.position - b.position)
        .map((entry) => entry.name);
      expect(names, `${path} JSON-LD trail`).toEqual(crumbs);
    }
  });

  test('flow: the trail does not scroll the page sideways at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const { path } of PUBLIC_TRAILS) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe('dashboard breadcrumbs', () => {
  test.describe.configure({ mode: 'serial' });

  test('flow: settings, profile and deep school routes show the full hierarchy', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');

    await page.goto('/dashboard/settings');
    expect(await crumbLabels(page, en['Shell.topbar.breadcrumbLabel'])).toEqual([
      en['Shell.topbar.dashboard'],
      en['Shell.nav.settings'],
    ]);

    await page.goto('/dashboard/school/classes');
    expect(await crumbLabels(page, en['Shell.topbar.breadcrumbLabel'])).toEqual([
      en['Shell.topbar.dashboard'],
      en['Shell.nav.school'],
      en['Shell.nav.classes'],
    ]);

    await page.goto('/dashboard/school/teachers');
    expect(await crumbLabels(page, en['Shell.topbar.breadcrumbLabel'])).toEqual([
      en['Shell.topbar.dashboard'],
      en['Shell.nav.school'],
      en['Shell.nav.teachers'],
    ]);
  });

  test('flow: a deep record route appends the record crumb, never a raw id', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    await page.goto('/dashboard/school/classes');

    const firstClass = page.locator('a[href^="/dashboard/school/classes/"]').first();
    await expect(firstClass).toBeVisible();
    const href = (await firstClass.getAttribute('href')) ?? '';
    const documentId = href.split('/').pop() ?? '';
    const className = (await firstClass.innerText()).trim();
    await firstClass.click();
    await page.waitForURL(`**${href}`);
    // The record crumb is published by the page once its query resolves, so wait
    // for the record itself to render before reading the trail.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const labels = await crumbLabels(page, en['Shell.topbar.breadcrumbLabel']);
    expect(labels.slice(0, 3)).toEqual([
      en['Shell.topbar.dashboard'],
      en['Shell.nav.school'],
      en['Shell.nav.classes'],
    ]);
    expect(labels.length, 'record crumb missing').toBe(4);
    expect(labels[3], 'the record crumb must be a name, never a documentId').not.toBe(documentId);
    expect(className, 'the record crumb must name the record').toContain(labels[3]);
  });

  test('flow: the ops console shows breadcrumbs on every surface', async ({ page }) => {
    await loginAs(page, 'ops');

    for (const [path, expected] of [
      ['/dashboard/ops/schools', [en['Shell.topbar.dashboard'], en['Shell.nav.ops'], en['Navigation.opsSchools']]],
      ['/dashboard/ops/pipeline', [en['Shell.topbar.dashboard'], en['Shell.nav.ops'], en['Navigation.opsPipeline']]],
      ['/dashboard/ops/timers', [en['Shell.topbar.dashboard'], en['Shell.nav.ops'], en['Navigation.opsTimers']]],
      ['/dashboard/ops/tools', [en['Shell.topbar.dashboard'], en['Shell.nav.ops'], en['Navigation.opsTools']]],
    ] as const) {
      await page.goto(path);
      expect(await crumbLabels(page, en['Shell.topbar.breadcrumbLabel']), path).toEqual([...expected]);
    }
  });
});
