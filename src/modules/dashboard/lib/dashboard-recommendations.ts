import { RECOMMENDATION_LIMIT } from '@/modules/dashboard/constants/dashboard.constants';
import { getProfileCompletion, hasEntryPlan } from '@/modules/dashboard/lib/dashboard-overview';
import type {
  DashboardOverview,
  DashboardRecommendation,
} from '@/modules/dashboard/types/dashboard-overview.types';

// The design's "Recommended this week" list (spec 01 §6.2) is three authored
// practice drills. There is no assignment, drill or recommendation record in the
// parent contract — inventing three would be exactly the fabricated content the
// BLOCKED list exists to refuse.
//
// What ships instead is the same three-row list built from real GAPS in the
// students read: a child with no target entry year/term, a child whose planning
// fields are part-filled, and — only once those are clear — the schools search.
// Every row points at a route that already exists, so nothing here is a promise.
export function getDashboardRecommendations(
  overview: DashboardOverview,
): DashboardRecommendation[] {
  if (overview.totalStudents === 0) {
    return [{ id: 'add-child', kind: 'addChild', student: null, href: '/dashboard/children/new' }];
  }

  const rows: DashboardRecommendation[] = [
    ...overview.recentStudents
      .filter((student) => !hasEntryPlan(student))
      .map((student): DashboardRecommendation => ({
        id: `plan-${student.documentId}`,
        kind: 'setPlan',
        student,
        href: `/dashboard/children/${student.documentId}`,
      })),
    ...overview.recentStudents
      .filter((student) => hasEntryPlan(student) && getProfileCompletion(student) < 100)
      .map((student): DashboardRecommendation => ({
        id: `detail-${student.documentId}`,
        kind: 'completeProfile',
        student,
        href: `/dashboard/children/${student.documentId}`,
      })),
  ].slice(0, RECOMMENDATION_LIMIT);

  if (rows.length < RECOMMENDATION_LIMIT) {
    // Distinct from the header's `?mode=schools` link on purpose: two anchors with
    // one identical href on the same screen is an ambiguous target for both a user
    // and a locator.
    rows.push({
      id: 'explore-schools',
      kind: 'exploreSchools',
      student: null,
      href: '/dashboard/search',
    });
  }

  return rows;
}
