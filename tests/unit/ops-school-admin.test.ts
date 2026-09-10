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
    // mvp/ops task 04 (R-01…R-06, Ops Portal.dc.html:25-47): the rail is the
    // design's two-region layout, asserted per region — ONE primary
    // Operations entry and ONE Account/footer entry. Still exhaustive on
    // purpose, which is what makes it catch a promoted Pipeline or Tools
    // entry at all, and it is why adding a rail entry has to be acknowledged
    // HERE rather than passing silently.
    const opsItems = filterNavByRole(NAV_ITEMS, OPS_ROLE_TYPE);
    const primary = opsItems.filter((item) => item.group === 'primary').map((item) => item.href);
    const account = opsItems.filter((item) => item.group === 'account').map((item) => item.href);

    expect(primary).toEqual(['/dashboard/ops/schools']);
    expect(account).toEqual(['/dashboard/ops/settings']);

    const hrefs = [...primary, ...account];
    // The intent this test was written for, asserted directly rather than left
    // implicit in the lists above.
    expect(hrefs).not.toContain('/dashboard/ops/pipeline');
    expect(hrefs).not.toContain('/dashboard/ops/tools');
    // The five retired console entries are absent from every region (R-01…R-06):
    // their routes keep serving until task 41, but the rail no longer links to them.
    for (const dest of ['timers', 'system', 'audit', 'comms', 'flags']) {
      expect(hrefs).not.toContain(`/dashboard/ops/${dest}`);
    }
    // Every ops rail destination must be a page that exists — the defect this
    // slice fixes was the inverse (pages with no entry), and the opposite defect
    // is a dead link.
    for (const href of hrefs) expect(href.startsWith('/dashboard/ops/')).toBe(true);
  });
});
