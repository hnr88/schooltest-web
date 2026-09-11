import type { DirectoryClientConfig } from '@/modules/directory';
import { CLASS_STATUS_KEY } from '@/modules/teacher/constants/teacher-kit.constants';
import { findTestLabel, testSessionMonitorHref } from '@/modules/teacher/lib/join-code';
import { classResultsHref } from '@/modules/teacher/lib/results-shell';
import { classBadgeCode } from '@/modules/teacher/lib/teacher-kit';
import type {
  ClassRowView,
  ClassYear,
  LiveStripCardView,
} from '@/modules/teacher/types/classes-screen.types';
import type {
  DashboardClass,
  DashboardClassReading,
  DashboardLiveSession,
  TeacherTest,
} from '@/modules/teacher/types/teacher.types';

/**
 * The Classes screen's pure layer over ONE read of C-TD-1. Nothing here
 * invents a value: an absent reading average stays `null`, an absent year stays
 * `null`, and the only derivations are the badge code and the year label.
 */

/** The class's reading block — OPTIONAL on the wire, so absent means "—". */
export function readingOf(card: DashboardClass): DashboardClassReading | null {
  return card.reading ?? null;
}

/** `year_level` when served, else the served `year_band` ("7_9" → Years 7–9). */
export function classYearOf(card: DashboardClass): ClassYear | null {
  const level = card.year_level;
  if (typeof level === 'number') return { kind: 'level', level };
  const band = card.year_band?.trim() ?? '';
  if (band === '') return null;
  const range = /^(\d{1,2})_(\d{1,2})$/.exec(band);
  if (range !== null) return { kind: 'band', from: Number(range[1]), to: Number(range[2]) };
  if (/^\d{1,2}$/.test(band)) return { kind: 'level', level: Number(band) };
  return { kind: 'raw', text: band };
}

/** The URL value of a year option (`?year=band-7-9`). */
export function classYearKey(year: ClassYear | null): string | null {
  if (year === null) return null;
  if (year.kind === 'level') return `level-${year.level}`;
  if (year.kind === 'band') return `band-${year.from}-${year.to}`;
  return `raw-${year.text}`;
}

function yearRank(year: ClassYear): number {
  if (year.kind === 'level') return year.level;
  if (year.kind === 'band') return year.from + 0.5;
  return Number.MAX_SAFE_INTEGER;
}

/** The distinct years of the teacher's own classes, youngest first. */
export function classYearOptions(
  classes: readonly DashboardClass[],
): Array<{ key: string; year: ClassYear }> {
  const seen = new Map<string, ClassYear>();
  for (const card of classes) {
    const year = classYearOf(card);
    const key = classYearKey(year);
    if (year !== null && key !== null && !seen.has(key)) seen.set(key, year);
  }
  return [...seen.entries()]
    .map(([key, year]) => ({ key, year }))
    .sort((a, b) => yearRank(a.year) - yearRank(b.year) || a.key.localeCompare(b.key));
}

/** PDF/LLM show only for a class with results (design `hasData`). */
export function hasClassExport(card: DashboardClass): boolean {
  const reading = readingOf(card);
  if (reading !== null) return reading.scored > 0;
  return card.test_a.completed + card.test_b.completed > 0;
}

export function toClassRowView(card: DashboardClass): ClassRowView {
  const reading = readingOf(card);
  return {
    id: card.class_document_id,
    name: card.name,
    badge: classBadgeCode(card.name),
    year: classYearOf(card),
    studentCount: card.student_count,
    statusKey: CLASS_STATUS_KEY[card.status],
    isLive: card.open_session_count > 0,
    readingAverage: reading?.average ?? null,
    readingDelta: reading?.delta ?? null,
    hasExport: hasClassExport(card),
    href: classResultsHref(card.class_document_id),
  };
}

/** "Least progress": lowest reading average first; classes without one last. */
function byLeastProgress(a: DashboardClass, b: DashboardClass): number {
  const left = readingOf(a)?.average ?? null;
  const right = readingOf(b)?.average ?? null;
  if (left === right) return a.name.localeCompare(b.name);
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}

/** Client mode over the loaded array — search, the two filters, the three sorts (`:93–116`). */
export const CLASSES_CLIENT_CONFIG: DirectoryClientConfig<DashboardClass> = {
  searchText: (card) => [card.name, card.top_gap?.name ?? ''],
  filterPredicates: {
    year: (card, value) => classYearKey(classYearOf(card)) === value,
    status: (card, value) => card.status === value,
  },
  comparators: {
    name: (a, b) => a.name.localeCompare(b.name),
    students: (a, b) => b.student_count - a.student_count || a.name.localeCompare(b.name),
    progress: byLeastProgress,
  },
};

/**
 * The live strip's cards. A card opens its class on the Live sessions tab with
 * that sitting; `live_sessions[]` names the class but carries no class id, so
 * the class is matched by its exact name among the teacher's own classes, and
 * an unmatched or ambiguous name falls back to the sitting's monitor.
 */
export function toLiveStripCards(
  sessions: readonly DashboardLiveSession[],
  classes: readonly DashboardClass[],
  tests: readonly TeacherTest[],
): LiveStripCardView[] {
  return sessions.map((session) => {
    const owners = classes.filter((card) => card.name === session.class_name);
    const owner = owners.length === 1 ? owners[0] : undefined;
    const href =
      owner === undefined
        ? testSessionMonitorHref(session.sitting_document_id)
        : `${classResultsHref(owner.class_document_id)}?tab=live&session=${session.sitting_document_id}`;
    return {
      sittingId: session.sitting_document_id,
      className: session.class_name,
      code: session.code,
      testLabel: findTestLabel(tests, session.test_variant),
      href,
    };
  });
}
