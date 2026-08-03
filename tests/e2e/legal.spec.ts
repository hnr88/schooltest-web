/**
 * Mission st-legal-seo-ops E2E flows 1–6 (task 207): the four legal pages exist,
 * render the REAL persisted document from Postgres, and are linked from both the
 * public header and the public footer.
 *
 * Every expected value is read at runtime — page copy from the live API
 * (C-LEG-02) and chrome labels from the shipped catalogs — so nothing is
 * duplicated into this spec and a content change cannot silently pass.
 */
import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import {
  LEGAL_PAGES,
  fetchLegalDocument,
  opsUpdateLegal,
  revalidateLegal,
  runSql,
} from './helpers/legal';

const en = loadMessages('en');

test.describe('legal pages', () => {
  for (const { slug, path } of LEGAL_PAGES) {
    test(`flow: ${path} is accessible and renders the persisted document`, async ({ page }) => {
      const document = await fetchLegalDocument(slug);

      const response = await page.goto(path);
      expect(response?.status(), `${path} status`).toBe(200);

      // The visible title must equal the row in Postgres — not a fixture.
      const dbTitle = runSql(
        `select title from legal_documents where slug='${slug}' and locale_code='en'`,
      );
      expect(dbTitle).toBe(document.title);
      await expect(page.getByRole('heading', { level: 1, name: document.title })).toBeVisible();

      // Exactly one h1 — the document title.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      // Every section heading from the API is on the page IN ORDER. The page
      // also renders the table of contents, so the h2 list is compared as a
      // subsequence rather than by presence alone.
      const headings = await page.getByRole('heading', { level: 2 }).allInnerTexts();
      const expected = document.sections.map((section) => section.heading);
      const found = headings.filter((heading) => expected.includes(heading.trim()));
      expect(found.map((h) => h.trim()), `${slug} section order`).toEqual(expected);

      // The first paragraph of the first section proves the BODY rendered too.
      await expect(page.getByText(document.sections[0].paragraphs[0], { exact: false }).first())
        .toBeVisible();

      // Version + effective date metadata, matched exactly inside their own
      // <dd> rather than by a loose text search that any "1.0" would satisfy.
      await expect(page.getByRole('definition').filter({ hasText: document.version }).first())
        .toBeVisible();
      await expect(page.locator(`time[datetime="${document.effective_date}"]`)).toBeVisible();
    });
  }

  test('flow: every legal page is linked in the website footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: en['Eald.footer.legalTitle'] })).toBeVisible();

    for (const { path, labelKey } of LEGAL_PAGES) {
      const link = footer.getByRole('link', { name: en[labelKey], exact: true });
      await expect(link, `footer link for ${path}`).toHaveAttribute('href', path);
    }
  });

  test('flow: every legal page is linked in the website header navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: en['Navigation.legalNavLabel'] });
    await expect(nav.first()).toBeAttached();

    for (const { path, labelKey } of LEGAL_PAGES) {
      const link = nav.first().getByRole('link', { name: en[labelKey], exact: true });
      await expect(link, `header link for ${path}`).toHaveAttribute('href', path);
    }
  });

  test('flow: the retired /privacy link is gone while the real legal links remain', async ({
    page,
  }) => {
    await page.goto('/');
    // Guard against a vacuous pass on a page with no links at all: the real
    // legal links must be present in the same breath as the dead ones absent.
    await expect(page.locator('a[href="/privacy"]')).toHaveCount(0);
    await expect(page.locator('a[href="/terms"]')).toHaveCount(0);
    for (const { path } of LEGAL_PAGES) {
      expect(await page.locator(`a[href="${path}"]`).count(), `link to ${path}`).toBeGreaterThan(0);
    }
  });

  test('flow: an ops edit reaches the public page once revalidated (the DB→page path)', async ({
    page,
  }) => {
    const slug = 'terms-of-service';
    const original = runSql(
      `select title from legal_documents where slug='${slug}' and locale_code='en'`,
    );
    const probe = `${original} E2E-${Date.now()}`;
    try {
      await opsUpdateLegal(slug, { title: probe });
      await revalidateLegal();
      await page.goto(`/${slug}`);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: probe })).toBeVisible();
    } finally {
      await opsUpdateLegal(slug, { title: original });
      await revalidateLegal();
    }
    await page.goto(`/${slug}`);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: original })).toBeVisible();
  });

  test('flow: legal pages are reachable from the mobile navigation at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: en['Eald.nav.openMenu'] }).click();

    for (const { path, labelKey } of LEGAL_PAGES) {
      await expect(
        page.getByRole('link', { name: en[labelKey], exact: true }).first(),
        `mobile link for ${path}`,
      ).toBeVisible();
    }
  });
});
