import { expect, test } from '@playwright/test';

import { formSignInCount, signedInContext, signedOutContext } from './helpers/auth-state';

/**
 * THE NEGATIVE CONTROL FOR THE AUTH-STATE FIXTURE.
 *
 * The fixture's whole purpose is to hand out an authenticated context without
 * driving the sign-in form. The failure that would make it dangerous is the
 * inverse: quietly authenticating a context that is SUPPOSED to be anonymous.
 * Several specs in this suite assert the signed-out bounce, and if the fixture
 * leaked auth into them they would invert silently — still green, asserting
 * nothing. So both directions are pinned here rather than assumed.
 *
 * A fixture asserted only on its happy path is the same defect as a check that
 * passes for a reason unrelated to the property it names.
 */
test.describe('the auth-state fixture', () => {
  test('a signed-in context reaches the dashboard WITHOUT driving the form', async ({ browser }) => {
    const before = formSignInCount();
    const { context, page } = await signedInContext(browser, 'teacher');
    try {
      // Authenticated: the dashboard renders rather than bouncing.
      await expect(page).toHaveURL(/\/dashboard(\/|$|\?)/);
      // ONE mint at most, and zero if a previous file in this worker already
      // minted it — which is the saving this fixture exists to produce.
      expect(formSignInCount() - before).toBeLessThanOrEqual(1);
    } finally {
      await context.close();
    }
  });

  test('a signed-out context is GENUINELY anonymous and bounces to sign-in', async ({ browser }) => {
    const context = await signedOutContext(browser);
    const page = await context.newPage();
    try {
      await page.goto('/dashboard');
      // The control: if the fixture had leaked storage state into a context
      // asked for anonymously, this would land on /dashboard and every
      // signed-out assertion in the suite would be worthless.
      await expect(page).toHaveURL(/\/sign-in/);
    } finally {
      await context.close();
    }
  });

  test('reusing the fixture a second time drives NO further sign-in', async ({ browser }) => {
    // The saving is only real if the second call is free. Asserted as a
    // difference, not an absolute, so it holds whatever ran before it.
    const before = formSignInCount();
    const { context } = await signedInContext(browser, 'teacher');
    try {
      expect(formSignInCount() - before, 'a reused identity mints nothing').toBe(0);
    } finally {
      await context.close();
    }
  });
});
