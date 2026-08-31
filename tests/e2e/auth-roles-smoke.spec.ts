/**
 * Smoke proof of the per-role auth fixture (mission task 005): every seeded
 * role signs in through the real /sign-in form against the LIVE app and lands
 * on its own authenticated screen with the JWT the API returned in
 * localStorage under the app's real key (`app.auth.token`).
 *
 * Expected landings come from the app's own routing, not from this file's
 * wishes: ROLE_DESTINATIONS sends school_admin to /dashboard/school and ops to
 * /dashboard/ops; teacher branches in place on /dashboard; parent (and every
 * other role) stays on the shared /dashboard overview. The web portal has NO
 * student-specific destination — the student renderer is a separate surface
 * (API CORS allow-lists :3010 for it) — so student1's honest landing here is
 * the shared overview, exactly what the app does with that role today.
 *
 * Serial on purpose: all sign-ins share one worker so the brute-force pacing
 * in roles.ts (20 POSTs/min/IP) actually applies across the whole file.
 */
import { test, expect } from './helpers/auth-fixture';
import type { AppRole } from './helpers/auth-fixture';

test.describe.configure({ mode: 'serial' });

interface RoleCase {
  readonly role: AppRole;
  readonly landing: RegExp;
}

const ROLE_CASES: readonly RoleCase[] = [
  { role: 'ops', landing: /\/dashboard\/ops/ },
  { role: 'opsApi', landing: /\/dashboard\/ops/ },
  { role: 'schoolAdmin', landing: /\/dashboard\/school/ },
  { role: 'schoolAdminB', landing: /\/dashboard\/school/ },
  { role: 'teacher', landing: /\/dashboard\/?$/ },
  { role: 'teacher2', landing: /\/dashboard\/?$/ },
  { role: 'parent', landing: /\/dashboard\/?$/ },
  { role: 'student', landing: /\/dashboard\/?$/ },
];

for (const roleCase of ROLE_CASES) {
  test.describe(`role: ${roleCase.role}`, () => {
    test.use({ role: roleCase.role });

    test('signs in through the real form and reaches its authenticated screen', async ({
      authPage,
    }) => {
      await expect(authPage).toHaveURL(roleCase.landing, { timeout: 20_000 });
      await expect(authPage).not.toHaveURL(/sign-in/);

      const token = await authPage.evaluate(() => window.localStorage.getItem('app.auth.token'));
      expect(typeof token).toBe('string');
      expect((token ?? '').split('.')).toHaveLength(3);
    });
  });
}
