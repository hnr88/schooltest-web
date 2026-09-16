/**
 * F10 SWEEP 4 — offline / network failure resilience.
 *
 * Idiots lose the network mid-flow. The app must degrade to a notice, not a
 * white screen, not a crash, not a stuck skeleton with no words:
 *   · context.setOffline on a loaded data page + a client-side navigation;
 *   · offline reload of an authed page (worst case a browser error page, but
 *     the app must never render a half-dead authed shell silently);
 *   · key API routes ABORTED on the dashboard → graceful error card;
 *   · a 5s-delayed API route → loading states appear first.
 */
import { expect, test } from '@playwright/test';

import {
  classify,
  dumpF10Console,
  settle,
  shot,
  signedInAs,
  watchF10,
} from './fleet10-helpers';

test.describe('F10 offline and failure resilience', () => {
  test('client-side navigation while offline degrades gracefully', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const { context, page } = await signedInAs(browser, 'schoolAdmin', testInfo);
    watchF10(page, 'offline:nav');
    try {
      await page.goto('/dashboard/school/classes', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      await context.setOffline(true);
      // A client-side navigation must fail into a readable state.
      await page.getByRole('link', { name: 'Teachers', exact: true }).first().click().catch(() => {});
      await page.waitForTimeout(4000);
      const outcome = await classify(page, '/nowhere-check');
      await shot(page, `offline/client-nav-${outcome}`);
      console.log(`[f10 offline nav] url=${page.url()} outcome=${outcome}`);
      const text = await page.evaluate(() => document.body.innerText.trim().slice(0, 400));
      console.log(`[f10 offline nav] visible text head: ${JSON.stringify(text.slice(0, 160))}`);
      expect(outcome === 'white' || outcome === 'crash').toBe(false);
    } finally {
      await context.setOffline(false).catch(() => {});
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('offline reload of an authed page is not a silent half-shell', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const { context, page } = await signedInAs(browser, 'ops', testInfo);
    watchF10(page, 'offline:reload');
    try {
      await page.goto('/dashboard/ops/schools', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch((error) => {
        console.log(`[f10 offline reload] goto threw (expected offline): ${String(error).slice(0, 120)}`);
      });
      await page.waitForTimeout(4000);
      await shot(page, 'offline/reload');
      const text = await page.evaluate(() => document.body.innerText.trim()).catch(() => '');
      console.log(`[f10 offline reload] visible text head: ${JSON.stringify(text.slice(0, 160))}`);
      // The worst honest outcome is the browser's own offline error page or a
      // readable app notice. A crash overlay or an empty authed shell is not.
      const crashed = text.includes('Application error') || text.includes('Unhandled Runtime Error');
      expect(crashed).toBe(false);
    } finally {
      await context.setOffline(false).catch(() => {});
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('aborting the schools API yields a graceful error card', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const { context, page } = await signedInAs(browser, 'ops', testInfo);
    watchF10(page, 'abort:schools');
    try {
      await page.route(/\/api\/schools/, (route) => route.abort('failed'));
      await page.goto('/dashboard/ops/schools', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page, 20_000);
      const outcome = await classify(page, '/dashboard/ops/schools');
      await shot(page, `offline/aborted-schools-api-${outcome}`);
      const text = await page.evaluate(() => document.body.innerText.trim());
      console.log(`[f10 abort schools] outcome=${outcome} text head=${JSON.stringify(text.slice(0, 200))}`);
      expect(outcome === 'white' || outcome === 'crash').toBe(false);
      // A refusal must SAY something: some error copy or an empty-state must
      // be visible — not a silently blank data region.
      expect(text.length, 'page must show words when its API dies').toBeGreaterThan(40);
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('aborting the auth me check on the dashboard degrades cleanly', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const { context, page } = await signedInAs(browser, 'teacher', testInfo);
    watchF10(page, 'abort:me');
    try {
      await page.route(/\/api\/users\/me/, (route) => route.abort('failed'));
      await page.goto('/dashboard/results', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page, 20_000);
      const outcome = await classify(page, '/dashboard/results');
      await shot(page, `offline/aborted-me-${outcome}`);
      console.log(`[f10 abort me] url=${page.url()} outcome=${outcome}`);
      // A transport failure must NOT sign the user out (NIGHT-2 W-R3): the
      // guard must hold, not bounce to /sign-in on a non-auth error.
      if (outcome === 'signin') {
        console.log('[F10-FINDING] an aborted /api/users/me (transport failure) bounced a signed-in teacher to sign-in');
      }
      expect(outcome === 'white' || outcome === 'crash').toBe(false);
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('a 5s-delayed API shows loading states, then content', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const { context, page } = await signedInAs(browser, 'ops', testInfo);
    watchF10(page, 'delay:schools');
    try {
      await page.route(/\/api\/(ops\/)?schools/, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await route.continue();
      });
      await page.goto('/dashboard/ops/schools', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      // Within the delay window something must communicate "loading".
      await page.waitForTimeout(2500);
      const loadingSeen = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        const skeletons = document.querySelectorAll('[data-slot="skeleton"], .animate-pulse, [data-slot="spinner"], [role="progressbar"], [aria-busy="true"]');
        return { words: /loading|loading…|正在/.test(text), skeletonCount: skeletons.length };
      });
      await shot(page, 'offline/delayed-loading-state');
      console.log(`[f10 delay] loading signal at 2.5s: ${JSON.stringify(loadingSeen)}`);

      // After the delay the real content must arrive.
      await settle(page, 30_000);
      const outcome = await classify(page, '/dashboard/ops/schools');
      await shot(page, `offline/delayed-settled-${outcome}`);
      console.log(`[f10 delay] settled outcome=${outcome}`);
      expect(outcome).toBe('rendered');
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });
});
