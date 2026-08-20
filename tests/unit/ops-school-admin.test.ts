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

    expect(hrefs).toEqual([
      '/dashboard/ops/schools',
      '/dashboard/ops/timers',
      '/dashboard/ops/settings',
    ]);
  });
});
