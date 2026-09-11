import type { RosterReleaseState, RosterRow } from '@/modules/results';

import { RELEASE_WHY_KEY, RELEASED_UNDATED_WHY_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { BLOCKED_RELEASE_KINDS, FILTER_RELEASE_KINDS } from '@/modules/teacher/constants/v2-thresholds.constants';
import { FAMILY_BANNER_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { expectedView, releaseActions, releaseStatus } from '@/modules/teacher/lib/v2/release';
import type {
  FamilyBanner,
  FamilyCounts,
  FamilyReportRow,
  FamilyReportsOptions,
  FamilyReportsView,
} from '@/modules/teacher/types/v2-family.types';

export function familyReportRow(row: RosterRow): FamilyReportRow {
  const { result, student, release_state: kind } = row;
  const releasedAt = result !== null && kind === 'released' ? result.published_at : null;
  return {
    studentDocumentId: student.document_id,
    resultDocumentId: result === null ? null : result.document_id,
    name: student.name,
    initials: student.initials,
    status: releaseStatus(kind),
    whyKey: kind === 'released' && releasedAt === null ? RELEASED_UNDATED_WHY_KEY : RELEASE_WHY_KEY[kind],
    releasedAt,
    score: result === null ? null : result.overall.domain_score,
    expected: result === null ? null : expectedView(result.readiness),
    actions: releaseActions(kind),
  };
}

function familyCounts(rows: readonly FamilyReportRow[]): FamilyCounts {
  const count = (kinds: readonly RosterReleaseState[]) => rows.filter((row) => kinds.includes(row.status.kind)).length;
  const released = count(['released']);
  const held = count(['held']);
  const open = count(['open']);
  const blocked = count(BLOCKED_RELEASE_KINDS);
  return {
    total: rows.length,
    scored: released + held,
    released,
    held,
    recalled: count(['recalled']),
    open,
    blocked,
    noResult: blocked + open,
  };
}

function familyBanner(counts: FamilyCounts): FamilyBanner | null {
  if (counts.total === 0) return null;
  const kind = counts.open + counts.blocked > 0 ? 'incomplete' : 'complete';
  return { kind, open: counts.open, blocked: counts.blocked, tone: FAMILY_BANNER_TONE[kind] };
}

export function familyReportRows(roster: readonly RosterRow[], options: FamilyReportsOptions = {}): FamilyReportsView {
  const filter = options.filter ?? 'all';
  const rows = roster.map(familyReportRow);
  const kinds = FILTER_RELEASE_KINDS[filter];
  const counts = familyCounts(rows);
  return {
    filter,
    rows: kinds === null ? rows : rows.filter((row) => kinds.includes(row.status.kind)),
    counts,
    banner: familyBanner(counts),
    releasableResultIds: rows.flatMap((row) =>
      row.status.kind === 'held' && row.resultDocumentId !== null ? [row.resultDocumentId] : [],
    ),
  };
}
