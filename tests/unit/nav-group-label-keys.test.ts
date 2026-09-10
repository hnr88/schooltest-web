import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import {
  OPS_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth/constants/role.constants';
import {
  NAV_GROUP_LABEL_KEYS,
  NAV_ITEMS,
} from '@/modules/shell/constants/nav.constants';
import { buildNavSections } from '@/modules/shell/lib/nav-sections';
import { filterNavByParentViews, filterNavByRole } from '@/modules/shell/lib/nav-visible';

// Teacher task 03 re-pointed ONE overline mapping — the teacher-only `teach`
// group now reads the design's TEACHER VIEW key (Teacher Portal v2.dc.html:27).
// The overline mechanism is shared by every portal, so this pins the other
// three roles' mapping UNCHANGED at the unit level (the parent rail is guarded
// by executable assertions here, not by a screenshot), and pins the new key in
// all six catalogues (D-33: `teach` is never deleted).
const WEB_ROOT = path.resolve(__dirname, '..', '..');
const LOCALES = ['en', 'ko', 'ms', 'th', 'vi', 'zh'] as const;

function groupsFor(locale: string): Record<string, string> {
  const catalog = JSON.parse(
    readFileSync(path.join(WEB_ROOT, 'src', 'i18n', 'messages', `${locale}.json`), 'utf8'),
  ) as { Shell?: { sidebar?: { groups?: Record<string, string> } } };
  return catalog.Shell?.sidebar?.groups ?? {};
}

describe('NAV_GROUP_LABEL_KEYS — the overline mapping per role', () => {
  it('parent, school-admin and ops keep reading Manage; only the teacher mapping changed', () => {
    // `primary` renders every non-teacher destination (parent, school admin and
    // ops alike) and `account` the pinned footer entry — both keep `manage`.
    expect(NAV_GROUP_LABEL_KEYS.primary).toBe('manage');
    expect(NAV_GROUP_LABEL_KEYS.account).toBe('manage');
    // The one deliberate change: the teacher-only group's overline.
    expect(NAV_GROUP_LABEL_KEYS.teach).toBe('teacherView');
  });

  it('the mapped keys exist in all six catalogues — and `teach` was not deleted (D-33)', () => {
    for (const locale of LOCALES) {
      const groups = groupsFor(locale);
      expect(groups.manage, `${locale}.Shell.sidebar.groups.manage`).toBeTruthy();
      expect(groups.teach, `${locale}.Shell.sidebar.groups.teach`).toBeTruthy();
      expect(groups.teacherView, `${locale}.Shell.sidebar.groups.teacherView`).toBeTruthy();
    }
  });

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
