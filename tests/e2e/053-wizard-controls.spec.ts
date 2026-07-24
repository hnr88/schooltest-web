import { expect, type APIRequestContext, type Locator, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent, skipOnboarding } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';
import { fillPersonalStep, wizardContinue } from './helpers/wizard-fill';

// Wizard CONTROL contract. The wizard's small enums (gender, target entry term,
// preferred contact channel) are canonical pill radiogroups, not the aria-pressed
// view switcher / 4-up card grid they shipped as. This spec pins the three things a
// screenshot cannot show: the radiogroup ARIA, the keyboard contract (arrows MOVE
// THE ANSWER, one tab stop), and a real pointer-measured 44px target.
// It creates NO students — it never reaches the submit button.
const en = loadMessages('en');
const usedEmails: string[] = [];

test.describe.configure({ mode: 'serial' });

/**
 * Real hit-target measurement: walk outward from the element's centre in 0.5px
 * steps until `document.elementFromPoint` stops resolving inside it. CSS geometry
 * lies here — an `::after` expansion is invisible to getComputedStyle and can be
 * clipped away by an ancestor's overflow.
 */
async function pointerBox(target: Locator): Promise<{ width: number; height: number }> {
  return target.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hits = (x: number, y: number) => {
      const at = document.elementFromPoint(x, y);
      return at !== null && (at === el || el.contains(at) || at.contains(el));
    };
    const walk = (dx: number, dy: number) => {
      let far = 0;
      for (let step = 0.5; step <= 60; step += 0.5) {
        if (!hits(cx + dx * step, cy + dy * step)) break;
        far = step;
      }
      return far;
    };
    return { width: walk(-1, 0) + walk(1, 0), height: walk(0, -1) + walk(0, 1) };
  });
}

async function expectHitTarget(target: Locator, label: string): Promise<void> {
  // `document.elementFromPoint` is VIEWPORT-relative and returns null outside it, so
  // an off-screen control measures short no matter how big its hit area is. The
  // portal wizard puts the gender row below the fold at 375; scroll it in first, then
  // measure. The assertion itself is unchanged.
  await target.scrollIntoViewIfNeeded();
  const box = await pointerBox(target);
  expect(box.width, `${label} pointer width`).toBeGreaterThanOrEqual(44);
  expect(box.height, `${label} pointer height`).toBeGreaterThanOrEqual(44);
}

async function authAndGoto(page: Page, request: APIRequestContext) {
  const parent = await registerAndConfirmParent(request, 'wizctl');
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  // Fresh parents start onboarding-pending; the dashboard guard would redirect
  // /dashboard/* to /onboarding, so resolve it through the real endpoint first.
  await skipOnboarding(request, jwt);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  await page.goto('/dashboard/children/new');
}

test('gender is a real radiogroup: named, one tab stop, arrows move the answer, 44px targets', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await authAndGoto(page, request);

  const gender = page.getByRole('radiogroup', {
    name: cat(en, 'StudentWizard.personal.gender.label'),
  });
  await expect(gender).toBeVisible();
  // Named by the field's own label element, not a duplicated aria-label string.
  const labelledBy = await gender.getAttribute('aria-labelledby');
  expect(labelledBy).toBeTruthy();
  await expect(page.locator(`#${labelledBy}`)).toHaveText(
    new RegExp(cat(en, 'StudentWizard.personal.gender.label')),
  );

  // `exact` matters: "Male" is a substring of "Female".
  const male = gender.getByRole('radio', {
    name: cat(en, 'StudentWizard.personal.gender.male'),
    exact: true,
  });
  const female = gender.getByRole('radio', {
    name: cat(en, 'StudentWizard.personal.gender.female'),
    exact: true,
  });
  const last = gender.getByRole('radio', {
    name: cat(en, 'StudentWizard.personal.gender.prefer_not_to_say'),
    exact: true,
  });
  await expect(gender.getByRole('radio')).toHaveCount(4);

  // Nothing selected yet, so the FIRST option carries the group's single tab stop.
  await expect(gender.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(male).toHaveAttribute('aria-checked', 'false');

  // ArrowRight MOVES THE ANSWER (a radiogroup, not a focus-only roving list).
  await male.focus();
  await page.keyboard.press('ArrowRight');
  await expect(female).toHaveAttribute('aria-checked', 'true');
  await expect(female).toBeFocused();
  await expect(gender.locator('[tabindex="0"]')).toHaveCount(1);

  await page.keyboard.press('End');
  await expect(last).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Home');
  await expect(male).toHaveAttribute('aria-checked', 'true');
  // ArrowLeft wraps back to the end.
  await page.keyboard.press('ArrowLeft');
  await expect(last).toHaveAttribute('aria-checked', 'true');

  // Every option is a real 44px pointer target at both widths.
  for (const size of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(size);
    for (const option of await gender.getByRole('radio').all()) {
      await expectHitTarget(option, `gender option @${size.width}`);
    }
  }

  // The aria-pressed view switcher is gone from the form entirely.
  await expect(page.locator('form [aria-pressed]')).toHaveCount(0);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('education selects show the LOCALIZED option label, and term/channel are radiogroups', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await authAndGoto(page, request);

  // Step 1 is gated and fully mandatory (task 005) — fill it VALIDLY to advance.
  await fillPersonalStep(page, en, { givenName: 'Ada' });
  await wizardContinue(page, en);

  // `year_level` submits the INT 9 but must display "Year 9" — the base-ui trigger
  // renders the raw value unless the select is given its item labels.
  const yearLevel = page.getByRole('combobox', { name: cat(en, 'StudentWizard.education.yearLevel') });
  await yearLevel.click();
  const label = icu(cat(en, 'StudentWizard.education.yearOption'), { n: '9' });
  const option = page.getByRole('option', { name: label, exact: true });
  await expectHitTarget(option, 'select option');
  await option.click();
  await expect(yearLevel).toContainText(label);

  const term = page.getByRole('radiogroup', {
    name: cat(en, 'StudentWizard.education.targetEntryTerm'),
  });
  await expect(term.getByRole('radio')).toHaveCount(4);
  await expectHitTarget(term.getByRole('radio').first(), 'term option');

  // current_school / current_year_level are mandatory too — the gated Continue
  // would bounce without them.
  await page.getByLabel(cat(en, 'StudentWizard.education.currentSchool')).fill('Oakwood Primary');
  await page
    .getByRole('combobox', { name: cat(en, 'StudentWizard.education.currentYearLevel') })
    .click();
  await page.getByRole('option').first().click();
  await page
    .getByRole('combobox', { name: cat(en, 'StudentWizard.education.targetEntryYear') })
    .click();
  await page.getByRole('option').first().click();
  await term.getByRole('radio').first().click();
  await wizardContinue(page, en);

  const channel = page.getByRole('radiogroup', {
    name: cat(en, 'StudentWizard.guardian.preferredContact'),
  });
  await expect(channel.getByRole('radio')).toHaveCount(4);
  await expect(
    channel.getByRole('radio', {
      name: cat(en, 'StudentWizard.guardian.channel.whatsapp'),
      exact: true,
    }),
  ).toHaveAttribute('aria-checked', 'true');
  for (const option of await channel.getByRole('radio').all()) {
    await expectHitTarget(option, 'channel option');
  }

  expect(errors, errors.join('\n')).toEqual([]);
});

test.afterAll(() => {
  for (const email of usedEmails) {
    deleteAuthEmailRows(email);
  }
});
