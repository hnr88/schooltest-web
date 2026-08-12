import type { ProgressDirection } from '@/modules/teacher/types/class-progress.types';
import type {
  MasteryBand,
  TeacherMasteryBands,
  TestVariant,
} from '@/modules/teacher/types/teacher.types';
import type {
  StudentDrillDownResponse,
  StudentProgress,
  StudentSubskill,
  StudentTestResult,
} from '@/modules/teacher/types/teacher-result.types';

export interface StudentDrillDownScreenProps {
  classDocumentId: string;
  studentDocumentId: string;
}

export interface StudentDrillDownBodyProps {
  data: StudentDrillDownResponse;
}

export interface StudentDrillDownHeaderProps {
  student: StudentDrillDownResponse['student'];
  /** Owner of the C-TR-7 export route — the student's own id alone cannot address it. */
  classDocumentId: string;
}

export interface StudentTestCardProps {
  test: StudentTestResult;
  bands: TeacherMasteryBands;
}

export interface MasteryLegendProps {
  bands: TeacherMasteryBands;
}

export interface SubskillTileGridProps {
  variant: StudentTestResult['variant'];
  subskills: readonly StudentSubskill[];
}

export interface SubskillTileProps {
  subskill: StudentSubskill;
}

/**
 * How one subskill tile may be drawn.
 *
 * `measured: false` is the honest no-measurement state: C-TR-2 sends
 * `likelihood: null` with `status: 'not_assessed'` for an attribute this result
 * never assessed, and that tile prints NO percentage — a `0%` would assert a
 * measured floor that does not exist.
 *
 * `measured: true` carries the server's own `likelihood` (already an integer
 * `0..100`) and the server's own `status` band. The band is transported, never
 * derived: no field here is compared to a cut.
 */
export type SubskillTileView =
  | { measured: false; status: MasteryBand }
  | { measured: true; likelihood: number; status: MasteryBand };

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
 * The `was 62% ↑16` line of one tile, split into the three things it prints.
 *
 * It exists ONLY when C-TR-2 sent both `previous_likelihood` and `delta`. A
 * `null` on either is "no earlier test, or the A/B pair is not comparable"
 * (.qa/CONTRACTS.md F-EQUATING-GATE) and yields `null` here — the UI then shows
 * NO delta, and nothing subtracts one likelihood from another to invent it.
 */
export interface SubskillDeltaView {
  previous: number;
  direction: ProgressDirection;
  magnitude: number;
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

export interface CollapsedTestSummaryProps {
  test: StudentTestResult;
}

export interface SubskillPillListProps {
  variant: TestVariant;
  subskills: readonly StudentSubskill[];
}

export interface SubskillPillProps {
  subskill: StudentSubskill;
}

export interface SubskillDeltaLineProps {
  delta: SubskillDeltaView;
}

export interface TestNotCompletedCardProps {
  variant: TestVariant;
}
