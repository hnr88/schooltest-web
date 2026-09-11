import type { TestVariant } from '@/modules/teacher/types/teacher.types';
import type { StudentTestResult } from '@/modules/teacher/types/teacher-result.types';
import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';
import type { BreadcrumbsProps } from '@/modules/teacher/types/teacher-kit-controls.types';
import type { StudentChartGeometry } from '@/modules/teacher/types/v2-chart.types';
import type { StudentDetailView, SubskillCard } from '@/modules/teacher/types/v2-student-detail.types';

export interface StudentDrillDownScreenProps {
  classDocumentId: string;
  studentDocumentId: string;
}

/**
 * One piece of student-page copy: a key under `TeacherPortal.student` (or
 * `TeacherPortal.viewModel` when `ns` says so) plus what fills its placeholders —
 * raw values, view-model labels (verbatim or lower-cased) and ISO dates printed as
 * a short month.
 */
export interface TextDescriptor {
  key: string;
  ns?: 'viewModel';
  values?: Readonly<Record<string, string | number>>;
  labels?: Readonly<Record<string, string>>;
  lowerLabels?: Readonly<Record<string, string>>;
  months?: Readonly<Record<string, string>>;
}

export type ProgressTileId = 'baseline' | 'latest' | 'growth' | 'sittings';

/** One cell of the progress card's 2×2 grid; `value: null` prints the kit dash, `fg: null` is navy. */
export interface ProgressTile {
  id: ProgressTileId;
  label: TextDescriptor;
  value: TextDescriptor | null;
  fg: string | null;
}

export type StudentPageStatus = 'pending' | 'error' | 'empty' | 'success';

/** The page's real actions: the C-TR-7 markdown download, a clipboard copy and the Ask AI drawer. */
export interface StudentDetailActions {
  exportPending: boolean;
  /** The last export was refused or failed; the header says so in text. */
  exportFailed: boolean;
  exportMarkdown: () => void;
  /** The Ask AI drawer is open for this student (the CTA reads "Hide AI"). */
  askAiOpen: boolean;
  /** Opens the drawer, or closes it when it is open. */
  askAi: () => void;
  copy: (text: string) => void;
}

export interface StudentSkillSelectProps {
  skill: SkillScopeValue;
  onValueChange: (skill: SkillScopeValue) => void;
}

export interface StudentDrillDownHeaderProps extends StudentSkillSelectProps {
  studentName: string;
  className: string;
  /** `null` while the student has no scored result: no chip and no actions. */
  overall: StudentDetailView['overall'] | null;
  actions: StudentDetailActions | null;
}

export interface StudentDrillDownBodyProps {
  view: StudentDetailView;
  firstName: string;
  onCopy: (text: string) => void;
}

export interface StudentProgressChartProps {
  chart: StudentChartGeometry;
}

export interface StudentSubskillCardProps {
  card: SubskillCard;
}

export interface StudentAnalysisCardProps {
  paragraphs: readonly string[];
  onCopy: () => void;
}

export interface StudentComingSoonProps extends StudentSkillSelectProps {
  firstName: string;
}

export interface StudentOverallChipProps {
  overall: StudentDetailView['overall'];
}

export interface StudentProgressPanelProps {
  view: StudentDetailView;
}

export type StudentTranslate = (key: string, values?: Record<string, string | number>) => string;

/** What resolving a `TextDescriptor` needs: both catalogs, a short-month printer and a lower-caser. */
export interface StudentTextTranslators {
  t: StudentTranslate;
  tVm: StudentTranslate;
  month: (iso: string) => string;
  lower: (text: string) => string;
}

export interface StudentText {
  text: (descriptor: TextDescriptor) => string;
  /** A sitting date as the chart's axis prints it ("Sep"); an undated sitting is blank. */
  month: (iso: string | null) => string;
  /** A sitting date as the chart's tooltip prints it ("September 2026"). */
  monthYear: (iso: string | null) => string;
  analysis: (view: StudentDetailView, first: string) => string[];
}

/** `useStudentDrillDownPage`: the page's read state, the student's view, the skill and the actions. */
export interface StudentDrillDownPage {
  status: StudentPageStatus;
  retry: () => void;
  className: string;
  studentName: string | null;
  firstName: string;
  view: StudentDetailView | null;
  skill: SkillScopeValue;
  setSkill: (skill: SkillScopeValue) => void;
  actions: StudentDetailActions;
  crumbs: BreadcrumbsProps;
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
