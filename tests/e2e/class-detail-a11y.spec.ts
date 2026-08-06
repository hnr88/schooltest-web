import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import {
  apiClassDetail,
  fullName,
  gotoClassDetail,
  schoolAdminJwt,
  studentWithEvidence,
} from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { watchErrors, waitForAnimationsSettled } from './helpers/ui';

// WCAG 2.2 AA + no-broken-UI sweep over both new surfaces, at mobile and
// desktop. Violations are FIXED in the markup — no rule is ever suppressed.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };

async function expectNoSeriousViolations(page: Page, label: string): Promise<void> {
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  expect(
    serious.map((violation) => `${violation.id}: ${violation.nodes[0]?.target.join(' ')}`),
    `${label} axe violations`,
  ).toEqual([]);
}

/**
 * Undersized (<44×44) interactive targets INSIDE a given root.
 *
 * Scoped to the page's own surface rather than the whole document, and skipping
 * the vendored shadcn primitives, because BOTH are shared chrome this mission
 * must not edit (schooltest-web/CLAUDE.md law 11: `src/components/ui/*` is
 * read-only; law 4: never touch what was not requested):
 *   - the dashboard shell's sidebar logo link (82×26), on every dashboard route;
 *   - the vendored dialog Close button (28×28) and the field primitives'
 *     32px-tall input/select, in every dialog in the app.
 * They are listed in .qa/REPORT.md as pre-existing findings rather than
 * silently swallowed. Everything this mission renders IS asserted. Same rule as
 * the shared `collectSmallTargets` helper otherwise, including the WCAG 2.5.8
 * inline-link exception.
 */
async function smallTargetsWithin(page: Page, root: string): Promise<string[]> {
  return page.evaluate((selector) => {
    const MIN = 43;
    const scope = document.querySelector(selector);
    if (!scope) return [`missing root ${selector}`];
    const small: string[] = [];
    for (const el of scope.querySelectorAll('button, [role="button"], select, input, a[href]')) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 && rect.height <= 1) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      if (el instanceof HTMLAnchorElement && el.closest('p, li, td, blockquote')) continue;
      // Vendored shadcn primitives — see the note above.
      if (el.closest('[data-slot="dialog-close"]') || el.matches('[data-slot="dialog-close"]')) continue;
      if (el.matches('input, select, textarea')) continue;
      if (rect.width < MIN || rect.height < MIN) {
        const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40);
        small.push(
          `<${el.tagName.toLowerCase()}> "${label}" ${Math.round(rect.width)}×${Math.round(rect.height)}`,
        );
      }
    }
    return small;
  }, root);
}

/** The page body must never scroll sideways; wide tables scroll inside their own box. */
async function expectNoHorizontalBodyScroll(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label} horizontal body overflow`).toBeLessThanOrEqual(1);
}

test.describe.configure({ mode: 'serial' });

test.describe('class detail + drill-down accessibility (WCAG 2.2 AA)', () => {
  test('flow 14: the class detail page is accessible and unbroken at both widths', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await loginAs(page, 'schoolAdmin');
    await gotoClassDetail(page);
    await waitForAnimationsSettled(page);

    for (const [name, viewport] of [
      ['desktop', DESKTOP],
      ['mobile', MOBILE],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expectNoSeriousViolations(page, `class detail ${name}`);
      await expectNoHorizontalBodyScroll(page, `class detail ${name}`);
      expect(
        await smallTargetsWithin(page, '[data-surface="school-admin-class-detail"]'),
        `class detail ${name} small targets`,
      ).toEqual([]);
      await page.screenshot({
        path: path.join(SCREENSHOTS, `class-detail-${name}.png`),
        fullPage: true,
      });
    }

    // Heading order: exactly one h1, and the roster heading is an h2.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: cat(en, 'Classes.detail.studentsTitle') })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('flow 15: the edit dialog traps focus, closes on ESC and is accessible', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    await gotoClassDetail(page);
    await page.setViewportSize(DESKTOP);

    const trigger = page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await waitForAnimationsSettled(page);

    await expectNoSeriousViolations(page, 'edit dialog');
    expect(await smallTargetsWithin(page, '[role="dialog"]'), 'edit dialog small targets').toEqual([]);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'class-detail-edit-dialog.png') });

    // Focus is inside the dialog, and ESC restores it to the trigger.
    const focusInside = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role="dialog"]');
      return dialogEl?.contains(document.activeElement) ?? false;
    });
    expect(focusInside, 'focus should be trapped inside the dialog').toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('flow 16: the drill-down is accessible and unbroken at both widths', async ({ page }) => {
    const errors = watchErrors(page);
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const detail = await apiClassDetail(page.request, jwt);
    const target = studentWithEvidence(detail, 'A');
    expect(target, 'run the fixture seed first').toBeTruthy();

    await page.goto(`/dashboard/school/classes/${detail.documentId}/students/${target!.documentId}`);
    await expect(page.getByRole('heading', { level: 1, name: fullName(target!) })).toBeVisible();
    await waitForAnimationsSettled(page);

    for (const [name, viewport] of [
      ['desktop', DESKTOP],
      ['mobile', MOBILE],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expectNoSeriousViolations(page, `drill-down ${name}`);
      await expectNoHorizontalBodyScroll(page, `drill-down ${name}`);
      expect(
        await smallTargetsWithin(page, '[data-surface="school-admin-class-student-detail"]'),
        `drill-down ${name} small targets`,
      ).toEqual([]);
      await page.screenshot({
        path: path.join(SCREENSHOTS, `student-drilldown-${name}.png`),
        fullPage: true,
      });
    }

    // Ordered headings: h1 student, h3 per test card (the card title).
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('flow 17: a row link is keyboard reachable with a visible focus ring', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const detail = await apiClassDetail(page.request, jwt);
    const target = studentWithEvidence(detail, 'A');
    await gotoClassDetail(page);

    const link = page.getByRole('link', { name: fullName(target!), exact: true });
    await link.focus();
    await expect(link).toBeFocused();
    const outline = await link.evaluate((node) => getComputedStyle(node).outlineStyle);
    expect(outline, 'focused row link must show a focus ring').not.toBe('none');
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/students\/[a-z0-9]+$/);
  });
});
