import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';

// Task 014 (axe leg of the C-UI-SHELL anchor, split from shell.spec.ts for the
// 200-line rule): /dashboard inside the real shell — desktop 1280, mobile 375,
// and the 375 Sheet-open nav state — must have zero serious/critical axe
// violations. Helper mirrors a11y-auth.spec.ts: serious/critical fail,
// moderate/minor are logged, documented exemptions are logged LOUDLY.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };

// Same documented vendored-primitive gap a11y-auth.spec.ts already carries for
// /dashboard: axe's scrollable-region-focusable fires on the students table's
// overflow wrapper — shadcn's read-only ui/table.tsx `<div data-slot=
// "table-container" class="…overflow-x-auto">`, unreachable from any caller
// without editing the vendored file (Law 11). Logged, never silently dropped.
const TABLE_SCROLL_EXEMPTION = ['scrollable-region-focusable'] as const;

async function expectAxeClean(
  page: Page,
  label: string,
  knownExemptions: readonly string[] = [],
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const isExempt = (violation: { id: string }) => knownExemptions.includes(violation.id);
  const severe = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const blockers = severe.filter((violation) => !isExempt(violation));
  const exempted = severe.filter((violation) => isExempt(violation));
  const advisories = results.violations.filter(
    (violation) => violation.impact === 'moderate' || violation.impact === 'minor',
  );
  if (exempted.length > 0) {
    console.log(
      `[axe ${label}] KNOWN NON-BLOCKING (documented vendored-primitive gap):`,
      exempted
        .map(
          (violation) =>
            `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
        )
        .join(', '),
    );
  }
  if (advisories.length > 0) {
    console.log(
      `[axe ${label}] moderate/minor:`,
      advisories
        .map((violation) => `${violation.impact}:${violation.id} ×${violation.nodes.length}`)
        .join(', '),
    );
  }
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    label,
  ).toEqual([]);
}

test.describe('shell axe — desktop (1280)', () => {
  test.use({ viewport: DESKTOP });

  test('/dashboard in the shell has zero serious/critical violations', async ({ page }) => {
    await loginAsParent(page);
    await page.waitForLoadState('networkidle');
    await expectAxeClean(page, 'shell /dashboard @ 1280px', TABLE_SCROLL_EXEMPTION);
  });
});

test.describe('shell axe — mobile (375)', () => {
  test.use({ viewport: MOBILE });

  test('closed and Sheet-open nav states have zero serious/critical violations', async ({
    page,
  }) => {
    await loginAsParent(page);
    await page.waitForLoadState('networkidle');
    await expectAxeClean(page, 'shell /dashboard @ 375px', TABLE_SCROLL_EXEMPTION);

    await page
      .getByRole('button', { name: cat(en, 'Shell.topbar.openNav'), exact: true })
      .click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    // Let the Sheet's 200ms entrance transition settle first: axe blends the
    // mid-fade opacity into its contrast math and would flag transient values
    // that the resting open state (scanned here) does not have.
    await sheet.evaluate(async (el) => {
      await Promise.all(
        el.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
      );
    });
    await expectAxeClean(page, 'shell /dashboard @ 375px Sheet open', TABLE_SCROLL_EXEMPTION);
  });
});
