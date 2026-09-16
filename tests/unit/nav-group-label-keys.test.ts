import { describe, expect, it } from 'vitest';

import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import {
  OPS_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth/constants/role.constants';
import {
  NAV_ITEMS,
} from '@/modules/shell/constants/nav.constants';
import { buildNavSections } from '@/modules/shell/lib/nav-sections';
import { filterNavByParentViews, filterNavByRole } from '@/modules/shell/lib/nav-visible';

describe('NAV_GROUP_LABEL_KEYS — the overline mapping per role', () => {
  it('no other role can ever read the new overline — the teach group is teacher-only', () => {
    for (const role of [PARENT_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE, OPS_ROLE_TYPE]) {
      const sections = buildNavSections(filterNavByParentViews(filterNavByRole(NAV_ITEMS, role)));
      expect(
        sections.some((section) => section.group === 'teach'),
        `${role} renders a teach-group section`,
      ).toBe(false);
    }
  });

  it('a teacher gets exactly the two design destinations, in order, role-gated', () => {
    const sections = buildNavSections(
      filterNavByParentViews(filterNavByRole(NAV_ITEMS, TEACHER_ROLE_TYPE)),
    );
    expect(sections.map((section) => section.group)).toEqual(['teach']);
    expect(sections[0].labelKey).toBe('teacherView');
    expect(sections[0].items.map((item) => item.href)).toEqual([
      '/dashboard/results',
      '/dashboard/test-sessions',
    ]);
    for (const item of sections[0].items) {
      // The `roles` gate and `exact: false` active-state matching are kept.
      expect(item.roles).toEqual([TEACHER_ROLE_TYPE]);
      expect(item.exact).toBe(false);
    }
  });
});
