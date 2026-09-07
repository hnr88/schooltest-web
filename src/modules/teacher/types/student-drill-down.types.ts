import type { TestVariant } from '@/modules/teacher/types/teacher.types';
import type { ResultView } from '@schooltest/scoring-contracts';
import type {
  StudentProgress,
  StudentTestResult,
} from '@/modules/teacher/types/teacher-result.types';

export interface StudentDrillDownScreenProps {
  classDocumentId: string;
  studentDocumentId: string;
}

export interface StudentDrillDownBodyProps {
  /** The RAW v2 view; the body builds its own display model from it. */
  view: ResultView;
}

export interface StudentDrillDownHeaderProps {
  studentDocumentId: string;
  displayName: string;
  /** Owner of the C-TR-7 export route — the student's own id alone cannot address it. */
  classDocumentId: string;
}

export interface StudentDrillDownScreenProps {
  classDocumentId: string;
  studentDocumentId: string;
}

/**
 * C-TR-2's `tests`, split by RECENCY and by nothing else.
 *
 * The server sends the array MOST RECENT FIRST, so `latest` is `tests[0]` and
 * every `earlier` entry collapses. The split never inspects `variant`: the UI
 * must not carry its own belief that "B is newer than A", because the ordering
 * authority is the server's `completed_at` sort, not a client-side rule.
 *
 * `missing` is the closed variant set (`testVariantSchema.options`) minus the
 * variants that actually arrived — the wireframe's "Test B — not yet completed"
 * placeholder, derived from the response rather than assumed.
 */
export interface DrillDownTestsView {
  latest: StudentTestResult;
  earlier: readonly StudentTestResult[];
  missing: readonly TestVariant[];
}

/**
 * How the comparison strip may report `progress.acara_from` → `acara_to`.
 *
 * `same` and `moved` are a STRING EQUALITY on the two names the server sent.
 * The wireframe's `↑` beside the phase is deliberately NOT reproduced: C-TR-2
 * carries no phase ordering, and a client-side ladder of ACARA phase names would
 * be exactly the client-side codebook this surface forbids.
 */
export type AcaraShiftView =
  | { kind: 'same'; phase: string }
  | { kind: 'moved'; from: string; to: string }
  | { kind: 'unknown' };

export interface StudentComparisonStripProps {
  /** C-TR-2's own `progress` object — present only when both tests are comparable. */
  progress: StudentProgress;
  /** The older test (`tests[1]`): its `variant` names the strip, its `score` is the "from". */
  earlier: StudentTestResult;
  /** The newest test (`tests[0]`): the "to" of every difference on the strip. */
  latest: StudentTestResult;
}

export interface TestNotCompletedCardProps {
  variant: TestVariant;
}

// Moved from the deleted `types/class-progress.types.ts` (task 34) — these two
// serve the drill-down's comparison strip now.

/** The SIGN of a difference the server already computed — never a band. */
export type ProgressDirection = 'up' | 'flat' | 'down';

/** One cell of a stat row (label / value / direction), drill-down comparison strip shape. */
export interface ProgressStatItem {
  key: string;
  label: string;
  value: string;
  direction: ProgressDirection | null;
  change: string | null;
  /** Optional second line under the value — the ACARA phase's "Same phase" / "Phase changed" WORD. */
  note?: string | null;
}
