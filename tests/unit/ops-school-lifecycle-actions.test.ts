import { describe, expect, it } from 'vitest';

import {
  primarySchoolLifecycleAction,
  schoolLifecycleActions,
} from '@/modules/ops/lib/school-lifecycle-actions';

describe('school lifecycle action derivations', () => {
  it('derives the primary action and menu from every portal status', () => {
    // The API refuses activate for a school that was never suspended
    // ("only a suspended school can be activated"), so trial/pending_setup
    // derive NO primary action and no activate menu entry.
    expect(primarySchoolLifecycleAction('active')?.key).toBe('suspend');
    expect(primarySchoolLifecycleAction('trial')).toBeNull();
    expect(primarySchoolLifecycleAction('pending_setup')).toBeNull();
    expect(primarySchoolLifecycleAction('suspended')?.key).toBe('reactivate');
    expect(primarySchoolLifecycleAction('archived')?.key).toBe('restore');

    const expectedMenus = {
      active: ['editDetails', 'inviteAdmin', 'suspend', 'archive'],
      trial: ['editDetails', 'inviteAdmin', 'archive'],
      pending_setup: ['editDetails', 'inviteAdmin', 'archive'],
      suspended: ['editDetails', 'inviteAdmin', 'reactivate', 'archive'],
      archived: ['editDetails', 'inviteAdmin', 'restore'],
    } as const;
    for (const [status, expected] of Object.entries(expectedMenus)) {
      expect(
        schoolLifecycleActions(status as keyof typeof expectedMenus).map(({ key }) => key),
      ).toEqual(expected);
    }
  });

  it('keeps destructive and typed-name confirmation flags on the irreversible entries', () => {
    const activeActions = schoolLifecycleActions('active');
    const suspend = activeActions.find((action) => action.key === 'suspend');
    const archive = activeActions.find((action) => action.key === 'archive');

    expect(suspend).toMatchObject({ danger: true, typed: false, targetStatus: 'suspended' });
    expect(archive).toMatchObject({ danger: true, typed: true, targetStatus: 'archived' });
    for (const status of ['active', 'trial', 'pending_setup', 'suspended', 'archived'] as const) {
      for (const action of schoolLifecycleActions(status)) expect(action.write).toBe(true);
    }
    expect(schoolLifecycleActions('archived').some(({ key }) => key === 'archive')).toBe(false);
  });
});
