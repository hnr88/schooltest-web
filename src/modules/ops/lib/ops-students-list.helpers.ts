import {
  OPS_STUDENT_STATUSES,
  OPS_STUDENT_YEAR_LEVEL_MAX,
  OPS_STUDENT_YEAR_LEVEL_MIN,
  type OpsStudentRow,
  type OpsStudentStatus,
} from '@schooltest/ops-contracts';

// Presentation helpers for the ops Students tab (OPS-045). Pure functions only:
// the tab component renders, it does not compute.

/** Year levels the contract accepts — 7..12, derived, never a literal list. */
export const OPS_STUDENT_YEAR_LEVELS: readonly number[] = Array.from(
  { length: OPS_STUDENT_YEAR_LEVEL_MAX - OPS_STUDENT_YEAR_LEVEL_MIN + 1 },
  (_, index) => OPS_STUDENT_YEAR_LEVEL_MIN + index,
);

/**
 * The kit stores filter values as strings; the wire wants the enum. Narrowed
 * by lookup — never a cast — so an out-of-list value decodes to undefined
 * (unfiltered) exactly like the API's own fail-open rule.
 */
export function opsStudentStatusFilterValue(
  value: string | undefined,
): OpsStudentStatus | undefined {
  return OPS_STUDENT_STATUSES.find((status) => status === value);
}

/**
 * The stored status → the pictured pill label key. `enrolled` is a roster row
 * whose setup is unfinished; the reference calls that "Pending setup". The
 * STORED value is never renamed — only its label.
 */
export function opsStudentStatusLabelKey(status: OpsStudentStatus): string {
  if (status === 'active') return 'statusActive';
  if (status === 'archived') return 'statusArchived';
  return 'statusPendingSetup';
}

/** Reference pill palette: Active green, Pending setup amber, Archived grey. */
export function opsStudentStatusTone(
  status: OpsStudentStatus,
): 'success' | 'warning' | 'secondary' {
  if (status === 'active') return 'success';
  if (status === 'enrolled') return 'warning';
  return 'secondary';
}

/** "Emma Tran" / "Emma" — a mononym keeps its single name, never a filler. */
export function opsStudentFullName(row: OpsStudentRow): string {
  const family = (row.family_name ?? '').trim();
  return family === '' ? row.given_name.trim() : `${row.given_name.trim()} ${family}`;
}

/**
 * The Level column: the CEFR band of the latest official result. Null when the
 * student has no result, or has one the crosswalk gave no band — never the
 * ACARA phase, which is a different scale and has its own column.
 */
export function opsStudentCefrLevel(row: OpsStudentRow): string | null {
  const level = row.latest_result?.cefr_level ?? null;
  return level === null || level.trim() === '' ? null : level;
}

/**
 * The Latest result column: "74% · 14 Jul". `percentage === 0` is a real score
 * and renders as "0%"; a result with no server-scored evidence renders as the
 * date alone; no result at all returns null so the caller shows "No result yet".
 */
export function opsStudentLatestResultLabel(
  row: OpsStudentRow,
  formatDate: (isoDate: string) => string,
): string | null {
  const latest = row.latest_result;
  if (latest === null) return null;
  const when = formatDate(latest.completed_at);
  return latest.percentage === null ? when : `${latest.percentage}% · ${when}`;
}

/**
 * The class filter options. Reuses the ops staff directory that already backs
 * the Classes tab (`/api/ops/schools/:documentId/teachers`) rather than adding
 * a second class read; classes are de-duplicated because a class appears once
 * per teacher and are ordered by the label the operator sees.
 */
export function opsStudentClassOptions(
  teachers: readonly { classes: readonly { documentId: string; name: string | null }[] }[],
): { value: string; label: string }[] {
  const byDocumentId = new Map<string, string>();
  for (const teacher of teachers) {
    for (const klass of teacher.classes) {
      if (!byDocumentId.has(klass.documentId)) {
        byDocumentId.set(klass.documentId, klass.name ?? klass.documentId);
      }
    }
  }
  return [...byDocumentId.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
