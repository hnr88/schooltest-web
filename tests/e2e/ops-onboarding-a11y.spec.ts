/**
 * Mission st-ops-onboarding — accessibility and responsive sweep (task 320).
 *
 * Three states of the new surface (button, modal open, invitation sent) at
 * desktop AND 375px: zero serious/critical axe violations, a working keyboard
 * path with focus management, WCAG 2.2 AA target sizes, no horizontal scroll and
 * no console errors.
 */
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  inviteViaApi,
  type FixtureSchool,
} from './helpers/ops-onboarding';
import { expectAxeClean, expectNoHorizontalScroll } from './helpers/ops-onboarding-a11y';
import { loginAs } from './helpers/roles';
import { watchErrors } from './helpers/ui';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.onboard.${key}`);
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };

test.describe.configure({ mode: 'serial' });

let prospect: FixtureSchool;
let invited: FixtureSchool;

test.beforeAll(async () => {
  const label = `a11y-${Date.now()}`;
  prospect = await createProspectSchool(label);
  invited = await createProspectSchool(`${label}-b`);
  const res = await inviteViaApi(invited.documentId, {
    first_name: 'Ada',
    last_name: 'Lovelace',
    contact_email: `ops-a11y-${label}@example.au`,
  });
  expect(res.status).toBe(201);
});

test.afterAll(async () => {
  await cleanupSchool(prospect.documentId);
  await cleanupSchool(invited.documentId);
});

for (const [name, viewport] of [
  ['desktop', DESKTOP],
  ['mobile-375', MOBILE],
] as const) {
  test(`a11y (${name}): the Onboard School button, the open modal and the sent state are all clean`, async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.setViewportSize(viewport);
    await loginAs(page, 'ops');

    // State 1 — the button.
    await page.goto(detailPath(prospect.documentId));
    await expect(page.getByRole('button', { name: t('button'), exact: true })).toBeVisible();
    await expectAxeClean(page, `onboard-button ${name}`);
    await expectNoHorizontalScroll(page, `onboard-button ${name}`);
    await page.screenshot({ path: path.join(SCREENSHOTS, `ops-onboarding-button-${name}.png`) });

    // State 2 — the modal, open, and again with every field in error.
    await page.getByRole('button', { name: t('button'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectAxeClean(page, `onboard-modal ${name}`);
    await expectNoHorizontalScroll(page, `onboard-modal ${name}`);
    await page.screenshot({ path: path.join(SCREENSHOTS, `ops-onboarding-modal-${name}.png`) });

    await dialog.getByRole('button', { name: t('submit'), exact: true }).click();
    await expect(dialog.getByText(cat(en, 'Ops.onboard.validation.required')).first()).toBeVisible();
    await expectAxeClean(page, `onboard-modal-errors ${name}`);
    await page.screenshot({
      path: path.join(SCREENSHOTS, `ops-onboarding-modal-errors-${name}.png`),
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // State 3 — the invitation-sent panel with Resend and Revoke.
    await page.goto(detailPath(invited.documentId));
    await expect(
      page.locator('[data-slot="ops-onboard-actions"][data-invitation="sent"]'),
    ).toBeVisible();
    await expectAxeClean(page, `onboard-sent ${name}`);
    await expectNoHorizontalScroll(page, `onboard-sent ${name}`);
    await page.screenshot({ path: path.join(SCREENSHOTS, `ops-onboarding-sent-${name}.png`) });

    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('keyboard: the button is reachable, Enter opens the modal, focus moves in, Escape returns it', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await loginAs(page, 'ops');
  await page.goto(detailPath(prospect.documentId));

  const button = page.getByRole('button', { name: t('button'), exact: true });
  await button.focus();
  await expect(button).toBeFocused();

  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Focus is inside the dialog, not stranded on the page behind it.
  const focusInside = await page.evaluate(() => {
    const active = document.activeElement;
    return Boolean(active?.closest('[role="dialog"]'));
  });
  expect(focusInside, 'focus moves into the dialog').toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button, 'focus returns to the trigger').toBeFocused();
});

/**
 * Target size, scoped to THIS mission's controls.
 *
 * WCAG 2.2 **AA** is SC 2.5.8 Target Size (Minimum) — 24x24 CSS px — and that is
 * asserted hard. The 44px figure is SC 2.5.5 Target Size (Enhanced), which is
 * AAA; this app deliberately reserves the 44px treatment for the primary AUTH
 * form controls (a11y-auth.spec.ts) and uses the design system's 40px control
 * height everywhere in the dashboard, including the four pre-existing buttons on
 * this very page. Sizing one new button differently would break the design
 * system the mission requires this work to follow, so anything between 24 and
 * 44px is LOGGED as evidence rather than asserted (the D22 precedent).
 */
async function measureOwnControls(page: Page, selector: string) {
  return page.evaluate((root) => {
    const scope = document.querySelector(root);
    if (!scope) throw new Error(`no element matched ${root}`);
    return [...scope.querySelectorAll('button, input, a[href], select')].map((el) => {
      const rect = el.getBoundingClientRect();
      const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40);
      return { label, width: Math.round(rect.width), height: Math.round(rect.height) };
    });
  }, selector);
}

async function assertTargets(page: Page, selector: string, label: string): Promise<void> {
  const controls = await measureOwnControls(page, selector);
  expect(controls.length, `${label}: found no controls to measure`).toBeGreaterThan(0);

  const belowAA = controls.filter((c) => c.width < 24 || c.height < 24);
  expect(
    belowAA.map((c) => `${c.label} ${c.width}x${c.height}`),
    `${label}: WCAG 2.2 AA SC 2.5.8 (24x24) violations`,
  ).toEqual([]);

  const belowEnhanced = controls.filter((c) => c.width < 44 || c.height < 44);
  if (belowEnhanced.length > 0) {
    console.log(
      `[targets ${label}] below the 44px enhanced target (design-system default height, advisory):`,
      belowEnhanced.map((c) => `${c.label} ${c.width}x${c.height}`).join(', '),
    );
  }
}

test('sizing: every control on the new surface clears the WCAG 2.2 AA target minimum', async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);
  await loginAs(page, 'ops');

  await page.goto(detailPath(prospect.documentId));
  await expect(page.getByRole('button', { name: t('button'), exact: true })).toBeVisible();
  await assertTargets(page, '[data-slot="ops-onboard-actions"]', 'onboard button');

  await page.getByRole('button', { name: t('button'), exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await assertTargets(page, '[data-slot="ops-onboard-dialog"]', 'onboard modal');
  await page.keyboard.press('Escape');

  await page.goto(detailPath(invited.documentId));
  await expect(
    page.locator('[data-slot="ops-onboard-actions"][data-invitation="sent"]'),
  ).toBeVisible();
  await assertTargets(page, '[data-invitation="sent"]', 'invitation sent panel');
});
