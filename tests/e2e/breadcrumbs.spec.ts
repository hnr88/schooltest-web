/**
 * Mission st-legal-seo-ops E2E flows 7–13 and 20 (task 212): breadcrumbs
 * everywhere — public pages, legal pages, settings and deep nested dashboard
 * routes — with the JSON-LD trail matching the registered one.
 *
 * RE-POINTED for the landing redesign: the public pages dropped the visible
 * breadcrumb ROW (no crumb nav renders on /, /diagnose, …), while the
 * BreadcrumbList JSON-LD survives on every public page. The public flows now
 * pin the structured trail — names, order and resolvable URLs — derived at
 * runtime from the SAME trail registry (Navigation.* / Landing.nav.* keys).
 *
 * The ops console flow (former `:144-160`) is DELETED by mvp/ops task 04 under
 * R-26: `/dashboard/ops/**` draws no topbar, so it draws no breadcrumb row —
 * the design replaces the crumb trail with in-page back links. Every other
 * portal keeps its trail and its flow here.
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
  { path: '/diagnose', crumbs: [en['Navigation.home'], en['Landing.nav.diagnose']] },
  { path: '/teach', crumbs: [en['Navigation.home'], en['Landing.nav.teach']] },
  { path: '/track', crumbs: [en['Navigation.home'], en['Landing.nav.track']] },
  { path: '/predict', crumbs: [en['Navigation.home'], en['Landing.nav.predict']] },
  { path: '/privacy-policy', crumbs: [en['Navigation.home'], en['Navigation.privacyPolicy']] },
  { path: '/terms-of-service', crumbs: [en['Navigation.home'], en['Navigation.termsOfService']] },
  { path: '/cookie-policy', crumbs: [en['Navigation.home'], en['Navigation.cookiePolicy']] },
  { path: '/gdpr', crumbs: [en['Navigation.home'], en['Navigation.gdpr']] },
];

interface BreadcrumbList {
  itemListElement: { position: number; name: string; item: string }[];
}

/** The page's BreadcrumbList JSON-LD node, position-sorted. */
async function jsonTrail(page: Page): Promise<BreadcrumbList> {
  const nodes = await parseJsonLd(page);
  const list = nodes.find((node) => node['@type'] === 'BreadcrumbList') as unknown as BreadcrumbList;
  expect(list, 'a BreadcrumbList JSON-LD node renders').toBeTruthy();
  return { itemListElement: [...list.itemListElement].sort((a, b) => a.position - b.position) };
}

/** Visible crumb labels, in DOM order, from a breadcrumb nav. */
async function crumbLabels(page: Page, label: string): Promise<string[]> {
  const items = page.getByRole('navigation', { name: label }).first().locator('li');
  const texts = await items.allInnerTexts();
  return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0 && t !== '/');
}

test.describe('public breadcrumbs', () => {
  for (const { path, crumbs } of PUBLIC_TRAILS) {
    test(`flow: ${path} carries the correct structured hierarchy`, async ({ page }) => {
      await page.goto(path);
      const list = await jsonTrail(page);
      const names = list.itemListElement.map((entry) => entry.name);
      expect(names, `${path} JSON-LD trail`).toEqual(crumbs);
    });
  }

  test('flow: every crumb URL resolves — no crumb points at a missing page', async ({
    page,
    request,
  }) => {
    for (const { path } of PUBLIC_TRAILS) {
      await page.goto(path);
      const list = await jsonTrail(page);
      for (const entry of list.itemListElement) {
        const res = await request.get(entry.item);
        expect(res.status(), `crumb ${entry.item} on ${path}`).toBe(200);
      }
    }
  });

  test('flow: crumb positions are contiguous from 1 — no gaps, no duplicates', async ({
    page,
  }) => {
    for (const { path, crumbs } of PUBLIC_TRAILS) {
      await page.goto(path);
      const list = await jsonTrail(page);
      expect(list.itemListElement.map((entry) => entry.position), `${path} positions`).toEqual(
        crumbs.map((_, index) => index + 1),
      );
      expect(new Set(list.itemListElement.map((entry) => entry.item)).size, `${path} unique urls`)
        .toBe(crumbs.length);
    }
  });

  test('flow: every public page renders without a stray visible crumb nav', async ({ page }) => {
    // The redesign removed the visible breadcrumb row on public pages: assert
    // no orphaned empty crumb nav renders (a leftover would break the design).
    for (const { path } of PUBLIC_TRAILS) {
      await page.goto(path);
      await expect(
        page.getByRole('navigation', { name: en['Navigation.breadcrumbLabel'] }),
      ).toHaveCount(0);
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
});
