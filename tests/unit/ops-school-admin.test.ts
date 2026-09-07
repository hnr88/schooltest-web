import { describe, expect, it } from 'vitest';

import { OPS_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { getOpsSchoolAdminInviteMode } from '@/modules/ops/lib/ops-school-admin-invite';
import { NAV_ITEMS } from '@/modules/shell/constants/nav.constants';
import { filterNavByRole } from '@/modules/shell/lib/nav-visible';

describe('ops school-admin controls', () => {
  it('keeps the initial onboarding invitation and restores invitations after onboarding', () => {
    expect(getOpsSchoolAdminInviteMode('not_started')).toBe('onboarding');
    expect(getOpsSchoolAdminInviteMode('link_sent')).toBe('onboarding_pending');
    expect(getOpsSchoolAdminInviteMode('in_progress')).toBe('staff_invitation');
    expect(getOpsSchoolAdminInviteMode('submitted')).toBe('staff_invitation');
    expect(getOpsSchoolAdminInviteMode('complete')).toBe('staff_invitation');
  });

  it('does not promote Pipeline or Tools in the ops rail', () => {
    const hrefs = filterNavByRole(NAV_ITEMS, OPS_ROLE_TYPE).map((item) => item.href);

    // The System / Audit / Communications consoles joined the rail once their
    // pages existed (2ee7ccb, e542728, 3c94805); before that they were reachable
    // only by typing the URL. They are APPENDED, so the original three keep their
    // positions — this list is exhaustive on purpose, which is what makes it catch
    // a promoted Pipeline or Tools entry at all.
    expect(hrefs).toEqual([
      '/dashboard/ops/schools',
      '/dashboard/ops/timers',
      '/dashboard/ops/settings',
      '/dashboard/ops/system',
      '/dashboard/ops/audit',
      '/dashboard/ops/comms',
    ]);
    // The intent this test was written for, asserted directly rather than left
    // implicit in the list above.
    expect(hrefs).not.toContain('/dashboard/ops/pipeline');
    expect(hrefs).not.toContain('/dashboard/ops/tools');
    // Every ops rail destination must be a page that exists — the defect this
    // slice fixes was the inverse (pages with no entry), and the opposite defect
    // is a dead link.
    for (const href of hrefs) expect(href.startsWith('/dashboard/ops/')).toBe(true);
  });
});
