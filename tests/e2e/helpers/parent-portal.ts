import { test } from '@playwright/test';

/**
 * The parent portal is MASKED, not deleted (st-mvp-pivot task 46): every
 * /dashboard/children destination renders ParentViewsUnavailable while
 * NEXT_PUBLIC_PARENT_VIEWS_ENABLED is off, which is how this stack ships.
 *
 * OFF COMES FROM THE SCHEMA DEFAULT, NOT FROM AN ENV FILE: the flag appears in
 * no .env here (there is no .env.local at all), so `src/lib/env.ts:16` —
 * `z.enum(['true','false']).default('false')` — is what masks the portal. This
 * comment used to cite .env.local, which would send anyone flipping the flag to
 * a file that does not exist.
 *
 * The skip below is still sound, and by a separate route: the test process and
 * the spawned `next dev` share one environment, so both read the flag the same
 * way whether it is exported or written to .env.local. The one state that would
 * split them is `reuseExistingServer` attaching to a server already running
 * under different env — then this reports the flag the suite INTENDED, not the
 * one the running portal was built with, and 14 spec files skip or run on it.
 *
 * Specs that assert parent-portal UI therefore cannot pass in that state — and
 * specs that assert the MASKED state (zz-task25-role-nav) cannot pass with the
 * flag on, so the suite can never be green in a single run without a guard.
 * Call this at the top of a parent-portal describe block: the specs SKIP while
 * the portal is masked and run unchanged the moment the flag flips on.
 */
export function parentPortalEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PARENT_VIEWS_ENABLED === 'true';
}

export function skipWhenParentPortalMasked(): void {
  test.skip(
    !parentPortalEnabled(),
    'parent portal is masked (NEXT_PUBLIC_PARENT_VIEWS_ENABLED is not "true")',
  );
}
