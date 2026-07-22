import { getStudentInitials } from '@/lib/student-name';
import { getAvatarTone } from '@/modules/design-system';
import type { AvatarStackEntry, StatStripItem } from '@/modules/design-system';
import {
  ACTIVITY_ROWS_LIMIT,
  FEATURED_STUDENTS_LIMIT,
  RECENT_STUDENTS_LIMIT,
  RECENTLY_ADDED_DAYS,
} from '@/modules/dashboard/constants/dashboard.constants';
import type {
  DashboardActivityEntry,
  DashboardOverview,
  PlanBoardLabels,
  ReadinessField,
  ReadinessFieldKey,
} from '@/modules/dashboard/types/dashboard-overview.types';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

const DAY_IN_MS = 86_400_000;

export function hasEntryPlan(student: StudentListRow): boolean {
  return Boolean(student.target_entry_year && student.target_entry_term);
}

export function getDashboardEntryPlan(student: StudentListRow): string | null {
  if (!student.target_entry_year) return null;

  return student.target_entry_term
    ? `${student.target_entry_year} · ${student.target_entry_term}`
    : student.target_entry_year;
}

export function getDashboardYearLevel(student: StudentListRow): string | null {
  return student.current_year_level ?? student.year_level?.toString() ?? null;
}

// Same field, rendered. `year_level` is a bare integer, so printing it raw puts a
// lone "8" where its neighbour reads "Year 7" — the caller supplies the localized
// "Year {level}" so the two sources of the same fact read alike.
export function getDashboardYearLabel(
  student: StudentListRow,
  formatLevel: (level: number) => string,
): string | null {
  if (student.current_year_level) return student.current_year_level;

  return student.year_level === null ? null : formatLevel(student.year_level);
}

// The design's per-child rail is six ticks (spec 01 §4.5). Its own six labels are
// a CEFR ladder, which Amendment A1 forbids as a cross-skill composite — so the
// rail is re-pointed at the six planning fields that already define readiness
// below. Same shape, same "how far along is this child" reading, and every tick
// is a field GET /api/my/students really returned.
const READINESS_FIELD_KEYS: readonly ReadinessFieldKey[] = [
  'familyName',
  'email',
  'nationality',
  'yearLevel',
  'entryYear',
  'entryTerm',
];

export function getReadinessFields(student: StudentListRow): ReadinessField[] {
  const values: Record<ReadinessFieldKey, string | null> = {
    familyName: student.family_name,
    email: student.email,
    nationality: student.nationality,
    yearLevel: getDashboardYearLevel(student),
    entryYear: student.target_entry_year,
    entryTerm: student.target_entry_term,
  };

  return READINESS_FIELD_KEYS.map((key) => ({ key, filled: Boolean(values[key]) }));
}

// Profile readiness is the share of the six planning fields a parent can fill in
// that carry a value — the only progress signal this account actually holds, so
// no number on the overview is invented.
export function getProfileCompletion(student: StudentListRow): number {
  const fields = getReadinessFields(student);

  return Math.round((fields.filter((field) => field.filled).length / fields.length) * 100);
}

// The four family-level counts, as bare stat-strip items. Every one is a count of
// rows GET /api/my/students actually returned — nothing is projected, averaged
// against a target or padded with an em dash when the family is empty (0 is a real
// answer, "—" would not be).
export function getPlanBoardStats(
  overview: DashboardOverview,
  labels: PlanBoardLabels,
): StatStripItem[] {
  const total = labels.format(overview.totalStudents);
  const allPlanned = overview.studentsMissingEntryPlan === 0;

  return [
    { value: total, label: labels.totalProfiles },
    {
      value: labels.fraction(labels.format(overview.studentsWithEntryPlan), total),
      label: labels.entryPlans,
      tone: allPlanned ? 'positive' : 'default',
    },
    {
      value: labels.format(overview.studentsMissingEntryPlan),
      label: labels.needingPlan,
      tone: allPlanned ? 'positive' : 'negative',
    },
    { value: labels.format(overview.enrolledStudents), label: labels.enrolled },
  ];
}

// The ledger list, newest change first. The parent contract publishes no event
// log, so the only two events that exist are the two timestamps every row already
// carries: a row whose `updatedAt` is later than its `createdAt` was edited, every
// other row was created. Nothing is invented and nothing is inferred beyond the
// comparison — and because it sorts by the LATEST change over the WHOLE family
// while the roster shows the newest four by creation, the two panels beside each
// other are not the same list twice.
function getRecentActivity(students: StudentListRow[]): DashboardActivityEntry[] {
  return students
    .map((student) => {
      const edited = student.updatedAt > student.createdAt;
      return {
        documentId: student.documentId,
        student,
        kind: edited ? ('updated' as const) : ('added' as const),
        at: edited ? student.updatedAt : student.createdAt,
      };
    })
    .sort((first, second) => second.at.localeCompare(first.at))
    .slice(0, ACTIVITY_ROWS_LIMIT);
}

// The §03 AvatarStack over the WHOLE family: initials derived from the names the
// API returned, tint keyed off the same documentId the cards and rows use, so one
// child is one colour everywhere on the screen. Decorative by construction — the
// stack carries a single accessible name and no disc announces separately.
function getFamilyAvatars(students: StudentListRow[]): AvatarStackEntry[] {
  return students.map((student) => ({
    initials: getStudentInitials(student),
    tone: getAvatarTone(student.documentId),
  }));
}

function isRecentlyAdded(student: StudentListRow, now: number): boolean {
  const createdAt = new Date(student.createdAt).getTime();

  return Number.isFinite(createdAt) && now - createdAt <= RECENTLY_ADDED_DAYS * DAY_IN_MS;
}

export function getDashboardOverview(students: StudentListRow[]): DashboardOverview {
  const totalStudents = students.length;
  const studentsWithEntryPlan = students.filter(hasEntryPlan).length;
  const now = Date.now();
  const byNewest = [...students].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );

  return {
    totalStudents,
    activeStudents: students.filter((student) => student.status === 'active').length,
    enrolledStudents: students.filter((student) => student.status === 'enrolled').length,
    studentsWithEntryPlan,
    studentsMissingEntryPlan: totalStudents - studentsWithEntryPlan,
    entryPlanCompletion:
      totalStudents === 0 ? 0 : Math.round((studentsWithEntryPlan / totalStudents) * 100),
    addedRecently: students.filter((student) => isRecentlyAdded(student, now)).length,
    profileCompletionAverage:
      totalStudents === 0
        ? 0
        : Math.round(
            students.reduce((total, student) => total + getProfileCompletion(student), 0) /
              totalStudents,
          ),
    featuredStudents: byNewest.slice(0, FEATURED_STUDENTS_LIMIT),
    recentStudents: byNewest.slice(0, RECENT_STUDENTS_LIMIT),
    recentActivity: getRecentActivity(students),
    familyAvatars: getFamilyAvatars(byNewest),
  };
}
