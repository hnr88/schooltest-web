import { expect, test } from '@playwright/test';

import { userRoleType } from './helpers/auth-db';
import { cat } from './helpers/i18n';
import {
  API_BASE,
  OPS_RAIL,
  TEACHER_RAIL,
  apiLogin,
  expectExactRail,
} from './helpers/teacher-auth-rail';
import { ACCOUNTS, DESKTOP, en, groupLabels, navLink, sidebar, signIn } from './helpers/teacher-rail';

// Task 050 — brief flows 1 and 2 of 28 (.qa/E2E-FLOWS.md). The regression proof
// that the ONE role-filtered shell (.qa/DECISIONS.md A4) scopes the rail by role:
//
//   Flow 1  a TEACHER signs in → the rail is EXACTLY Reports (Manage) · Dashboard · Test sessions · Results (Teach)
//   Flow 2  an OPS account signs in → the five ops destinations, none of the teacher trio
//
// EXACT SET, never "the three are present": `expectExactRail` compares the whole
// rendered `label|href` list with `toEqual`, so a fifth entry surviving for a
// teacher (Search, Settings, …) FAILS this spec instead of slipping past
// a containment check.
//
// Both accounts sign in through the REAL /sign-in form against the REAL Strapi on
// the port schooltest-web/.env points the axios instance at; passwords come from
// schooltest-api/.env and role slugs out of the REAL Postgres via psql. No route
// interception, no injected token, no fixture.

test.describe('flows 1-2 — teacher auth + sidebar scoping', () => {
  test.use({ viewport: DESKTOP });

  test('the real Postgres and the real API agree on the teacher identity the rail filters on', async ({
    request,
  }) => {
    expect(userRoleType(ACCOUNTS.teacher.email)).toBe('teacher');

    const jwt = await apiLogin(request, 'teacher');
    const me = await request.get(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(me.status()).toBe(200);
    const identity = (await me.json()) as { email: string; role?: { type?: string } };
    expect(identity.email).toBe(ACCOUNTS.teacher.email);
    expect(identity.role?.type).toBe('teacher');
  });

  test('flow 1 — a teacher signs in and the rail is EXACTLY Reports, Dashboard, Test sessions, Results', async ({
    page,
  }) => {
    await signIn(page, 'teacher');
    await expectExactRail(page, TEACHER_RAIL);

    // Two sections in NAV_GROUP_ORDER: Manage (reports) then Teach (the trio).
    await expect(groupLabels(page)).toHaveCount(2);
    await expect(groupLabels(page).first()).toHaveText(cat(en, 'Shell.sidebar.groups.manage'));
    await expect(groupLabels(page).last()).toHaveText(cat(en, 'Shell.sidebar.groups.teach'));
    // The role chip lives in the sidebar's user-menu trigger (UserMenu), not a
    // dedicated slot anymore.
    const userMenu = sidebar(page).getByRole('button', {
      name: cat(en, 'Shell.topbar.userMenuLabel'),
    });
    await expect(userMenu).toContainText(cat(en, 'Shell.userMenu.roles.teacher'));

    // The rail must not be an artefact of the ['auth','me'] entry the login
    // mutation seeds: prove it on a hard load of a teacher route, and again
    // across a full reload.
    await page.goto('/dashboard/results');
    await expectExactRail(page, TEACHER_RAIL);
    await page.reload();
    await expectExactRail(page, TEACHER_RAIL);
  });

  test('flow 2 — an ops account signs in and the teacher items are absent from the rail', async ({
    page,
  }) => {
    await signIn(page, 'ops');
    await expectExactRail(page, OPS_RAIL);

    // Named explicitly, not only through the derived sweep. The teacher Dashboard
    // entry shares `/dashboard` with other roles' homes, so that one is absent
    // by LABEL; the other two are absent by label AND by destination.
    for (const item of TEACHER_RAIL) {
      await expect(
        navLink(page, cat(en, item.key)),
        `ops rail carries the teacher "${cat(en, item.key)}" item`,
      ).toHaveCount(0);
    }
    await expect(sidebar(page).locator('a[href="/dashboard/test-sessions"]')).toHaveCount(0);
    await expect(sidebar(page).locator('a[href="/dashboard/results"]')).toHaveCount(0);

    await expect(groupLabels(page)).toHaveCount(1);
    await expect(groupLabels(page)).toHaveText(cat(en, 'Shell.sidebar.groups.manage'));

    await page.goto('/dashboard/ops/timers');
    await expectExactRail(page, OPS_RAIL);
  });

  test('flow 2 — the real API never reports the ops account as a teacher', async ({ request }) => {
    expect(userRoleType(ACCOUNTS.ops.email)).toBe('ops');

    const jwt = await apiLogin(request, 'ops');
    const me = await request.get(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    // Measured on this instance: 403 ForbiddenError — the seeded Admin role holds
    // no users-permissions `me` grant, so the portal never learns the slug and the
    // role-gated items stay hidden (filterNavByRole hides them on a null role).
    // 200 is the other legitimate answer (the grant exists). Either way the gate
    // must never see 'teacher'; any other status here is a defect, not a fallback.
    expect([200, 403]).toContain(me.status());
    const roleType =
      me.status() === 200
        ? (((await me.json()) as { role?: { type?: string } }).role?.type ?? null)
        : null;
    expect(roleType).not.toBe('teacher');
  });
});
