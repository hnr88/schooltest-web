import type { ResultView } from '@schooltest/scoring-contracts';

import type { RosterReleaseState, RosterRow } from '@/modules/results';

import {
  HELD_UNSCORED_WHY_KEY,
  RELEASE_WHY_KEY,
  RELEASED_UNDATED_WHY_KEY,
} from '@/modules/teacher/constants/v2-i18n.constants';
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

/**
 * The row's why-line. "Scored and ready" (`release.why.held`) is only true WITH a score:
 * a held result whose `overall.domain_score` is null says what its own `status` reports —
 * hand scoring, a failed or still-running scoring run — and falls back to the neutral
 * "Not scored yet" when the status says nothing more (P1 parity row 6).
 */
function whyKey(kind: RosterReleaseState, result: ResultView | null, releasedAt: string | null): string {
  if (kind === 'released' && releasedAt === null) return RELEASED_UNDATED_WHY_KEY;
  if (kind === 'held' && result !== null && result.overall.domain_score === null) {
    return HELD_UNSCORED_WHY_KEY[result.status];
  }
  return RELEASE_WHY_KEY[kind];
}

/**
 * The design's day-first date ("31 August", `:1912` "sat 31 August"). `Intl` formats in the
 * reader's own locale — no locale is hard-coded — and the day and month swap ONLY where that
 * locale puts a NAMED month first and separates the two with plain punctuation ("September
 * 10" -> "10 September"). A locale that numbers its months keeps its own order, marker and
 * all (ko, zh); ms, th and vi already read day-first (P1 parity row 8).
 */
export function dayFirstDate(locale: string, iso: string, options: Intl.DateTimeFormatOptions): string {
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(new Date(iso));
  const month = parts.findIndex((part) => part.type === 'month');
  const day = parts.findIndex((part) => part.type === 'day');
  const values = parts.map((part) => part.value);
  if (month === -1 || day === -1 || day < month) return values.join('');
  const named = !/\p{Nd}/u.test(values[month]);
  const separated = parts.slice(month + 1, day).every((part) => part.type === 'literal' && /^[\s,.]*$/.test(part.value));
  if (!named || !separated) return values.join('');
  [values[month], values[day]] = [values[day], values[month]];
  return values.join('');
}

export function familyReportRow(row: RosterRow): FamilyReportRow {
  const { result, student, release_state: kind } = row;
  const releasedAt = result !== null && kind === 'released' ? result.published_at : null;
  return {
    studentDocumentId: student.document_id,
    resultDocumentId: result === null ? null : result.document_id,
    name: student.name,
    initials: student.initials,
    status: releaseStatus(kind),
    whyKey: whyKey(kind, result, releasedAt),
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
