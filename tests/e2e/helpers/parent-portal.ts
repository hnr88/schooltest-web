import { test } from '@playwright/test';

/**
 * The parent portal is MASKED, not deleted (st-mvp-pivot task 46): every
 * /dashboard/children destination renders ParentViewsUnavailable while
 * NEXT_PUBLIC_PARENT_VIEWS_ENABLED is off, which is how this stack ships
 * (schooltest-web/.env.local).
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
