/**
 * D-009: a registry path with no page must never become a breadcrumb LINK.
 *
 * `/dashboard/teach/classes` and `/dashboard/teach/results` are registered in
 * TRAIL_LABELS as real levels of the teacher hierarchy, but neither has a
 * `page.tsx` — only `classes/[documentId]` and `results/[classId]` do, and the
 * MVP design pictures no teacher classes-list or results-index surface.
 *
 * Today nothing in `modules/teach` publishes a record crumb, so the ancestor
 * happens to land as the LAST crumb (`isCurrent`) and renders as text. That is
 * an accident of what the teach pages don't do, not a guarantee: the moment a
 * teach page adds `<RecordCrumb label={cls.name} />` — which every other detail
 * page in the app already does — the ancestor stops being current and
 * `build-trail` hands it an `href` to a route that does not exist.
 *
 * These cases pin the guarantee at the source by supplying `recordLabel`, which
 * is exactly the condition that turns the ancestor into a link.
 */
import { describe, expect, it } from 'vitest';

import { buildTrail } from '@/modules/navigation/lib/build-trail';
import {
  TRAIL_LABELS,
  TRAIL_NONLINK_PATHS,
} from '@/modules/navigation/constants/trail.constants';
import type { TrailCrumb } from '@/modules/navigation/types/navigation.types';

/** A crumb the user can press: not the current page, and not label-only. */
const isLinkable = (crumb: TrailCrumb): boolean => !crumb.isCurrent && !crumb.isNonLink;

const RECORD_ROUTES: readonly { path: string; ancestor: string }[] = [
  { path: '/dashboard/teach/classes/abcdef1234567890', ancestor: '/dashboard/teach/classes' },
  { path: '/dashboard/teach/results/abcdef1234567890', ancestor: '/dashboard/teach/results' },
];

describe('buildTrail — page-less registry paths are label-only', () => {
  for (const { path, ancestor } of RECORD_ROUTES) {
    it(`${ancestor} keeps its label but is never linkable on ${path}`, () => {
      // recordLabel present = the record crumb is appended, so the ancestor is
      // no longer the current crumb. This is the exact state that produced the
      // dead link.
      const { crumbs } = buildTrail(path, { recordLabel: 'Year 5A', includeRoot: false });

      const crumb = crumbs.find((entry) => entry.href === ancestor);
      expect(crumb, `${ancestor} must still appear in the trail`).toBeDefined();
      expect(crumb?.isCurrent, 'the record crumb is current, not the ancestor').toBe(false);

      // The label survives — this is a hierarchy level, not a deletion.
      expect(crumb?.labelKey, `${ancestor} keeps its registry label`).toBe(TRAIL_LABELS[ancestor]);

      // And it is not pressable, because there is nothing to press.
      expect(isLinkable(crumb as TrailCrumb), `${ancestor} has no page, so it must not link`).toBe(
        false,
      );
    });
  }

  it('every non-link path is a registered label, so no level loses its name', () => {
    for (const path of TRAIL_NONLINK_PATHS) {
      expect(TRAIL_LABELS[path], `${path} must still carry a label`).toBeTruthy();
    }
  });

  it('a registry path that HAS a page stays linkable when it is an ancestor', () => {
    // Guards over-reach: the fix must not make ordinary ancestors unpressable.
    const { crumbs } = buildTrail('/dashboard/school/classes/abcdef1234567890', {
      recordLabel: 'Year 5A',
      includeRoot: false,
    });
    const ancestor = crumbs.find((entry) => entry.href === '/dashboard/school/classes');
    expect(ancestor, '/dashboard/school/classes is an ancestor here').toBeDefined();
    expect(isLinkable(ancestor as TrailCrumb), 'it has a page, so it must stay a link').toBe(true);
  });
});
