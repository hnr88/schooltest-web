import type { Band, ResultView } from '@schooltest/scoring-contracts';

import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { resolveDisplayLabel, splitDisplayLabel } from '@/modules/report/lib/display-label';
import { PARENT_SUBSKILL_ORDER, PARENT_TONE_BY_STATUS } from '@/modules/report/constants/lib.constants';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';
import type {
  ParentHeadline,
  ParentReportView,
  ParentSubskillGroup,
  ParentSubskillState,
  ParentSubskillsView,
} from '@/modules/report/types/report-view.types';
import type { ResultView as V1ResultView } from '@/modules/report/types/report.types';

import { PARENT_STATE_PHRASE, bandToParentState } from '@/modules/report/lib/parent-tone';

/* ────────────────────────────────────────────────────────────────────────────
 * LEGACY ARM (v1) — unchanged behaviour, still consumed live by
 * TeacherReportScreen (task 36's file) until its re-point lands. Do not edit
 * while task 36 is in flight; the arm is deleted when the consumer moves.
 * ──────────────────────────────────────────────────────────────────────────── */

// The seeded Crosswalk composes `display_label` as "{label} ({qualifiers})", and
// a live qualifier is "misses stated detail" while Doc 2a s.9 names "B1
// vocabulary gap" — deficit phrasing and a CEFR band code. The parent headline is
// the RUNG ALONE, through the same split the teacher panel already performs.
// Nothing is re-worded and nothing is re-derived.
function buildHeadline(result: V1ResultView): ParentHeadline {
  const resolved = resolveDisplayLabel(result);
  if (resolved.state === 'derived') {
    return { state: 'derived', label: splitDisplayLabel(resolved.label).label };
  }
  return { state: resolved.state };
}

function stateFor(row: AttributeRowView): ParentSubskillState {
  return row.state === 'assessed' ? PARENT_TONE_BY_STATUS[row.status] : 'not_assessed';
}

// Counts of SUBSKILLS, never of items and never a proportion. A state with no
// subskill is not emitted, so the list carries no zero row (E11-13).
function groupSubskills(rows: readonly AttributeRowView[]): ParentSubskillGroup[] {
  const counts = new Map<ParentSubskillState, number>();
  for (const row of rows) {
    const state = stateFor(row);
    const seen = counts.get(state);
    counts.set(state, seen === undefined ? 1 : seen + 1);
  }
  return PARENT_SUBSKILL_ORDER.flatMap((state) => {
    const count = counts.get(state);
    return count === undefined ? [] : [{ state, count }];
  });
}

// `buildAttributePanel` is REUSED rather than re-derived, so the two modes read
// the same evidence map through the same absence machine: a result the teacher
// mode calls not_applicable cannot become "not derived yet" for the family.
function buildSubskills(result: V1ResultView): ParentSubskillsView {
  const panel = buildAttributePanel(result);
  if (panel.state !== 'rows') return { state: panel.state };
  return { state: 'groups', groups: groupSubskills(panel.rows), total: panel.rows.length };
}

// E11-14/E11-15(a). The ONLY constructor of the v1 parent surface's data.
export function buildParentReport(result: V1ResultView): ParentReportView {
  return {
    headline: buildHeadline(result),
    skill: result.skill,
    publishedAt: result.published_at,
    subskills: buildSubskills(result),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * FAMILY PREVIEW (task 35, spec v2) — the v2 allow-list constructor. The
 * returned object is built key by key, so a field added upstream is excluded
 * by DEFAULT: `prob`, `prob_se`, `se`, `theta`, `readiness`, `cefr_band`,
 * `low_confidence` and every audit code are absent from the family rendering
 * structurally, not by a deny-list conditional a later edit could drop.
 *
 * Rulings carried:
 * - A not-assessed skill is NEVER a strength and never a focus: it is an
 *   absence of evidence, so a family "next step" for it would invent both the
 *   finding and the advice.
 * - Critical Reading is not comparable with the banded skills (no posterior,
 *   no band — the Screen C ruling 4a) and in the v2 view it is not an
 *   attribute at all, so it cannot reach these lists.
 * - The EAL/D note (dashboard §5) is deliberately ABSENT: ResultView carries
 *   no student identity — not even an opaque id (D19, placed on task 23) — so
 *   the roster flag is not reachable from what this module legitimately has,
 *   and deriving EAL/D status from scores is forbidden. The note returns with
 *   D19.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FamilyStrength {
  skill: string;
  score: number;
  line: string;
}

export interface FamilyNextStep {
  line: string;
}

export interface FamilySubskillGroup {
  state: 'secure' | 'getting_there' | 'not_yet' | 'not_assessed';
  count: number;
}

/** The v2 family-preview model — every key it may ever emit is named here. */
export interface FamilyPreviewView {
  overall: { score: number | null };
  phase: { label: string | null };
  skill: string | null;
  publishedAt: string | null;
  strengths: FamilyStrength[];
  nextSteps: FamilyNextStep[];
  subskills: { state: 'groups'; groups: FamilySubskillGroup[]; total: number };
}

const FAMILY_STATE_ORDER: ReadonlyArray<FamilySubskillGroup['state']> = [
  'secure',
  'getting_there',
  'not_yet',
  'not_assessed',
];

const GENERIC_PRACTICE_LINE =
  'Short, regular reading practice at home — shared reading and talking about what was read — supports every strand.';

function familyStateFor(band: Band): FamilySubskillGroup['state'] {
  return bandToParentState(band);
}

export function buildFamilyPreview(view: ResultView): FamilyPreviewView {
  const assessed = Object.entries(view.attributes).flatMap(([skill, attribute]) =>
    attribute.status === 'not_assessed'
      ? []
      : [{ skill, score: attribute.domain_score, state: familyStateFor(attribute.status) }],
  );

  const byScore = [...assessed].sort((a, b) => b.score - a.score);
  const strengths = byScore.slice(0, 2).map(({ skill, score, state }) => ({
    skill,
    score,
    line: `${skill} — ${score}% — ${PARENT_STATE_PHRASE[state]}`,
  }));

  const focus = byScore.at(-1);
  const nextSteps: FamilyNextStep[] = focus === undefined ? [] : [
    { line: `Focus next: ${focus.skill} — ${focus.score}% — ${PARENT_STATE_PHRASE[focus.state]}` },
    { line: GENERIC_PRACTICE_LINE },
  ];

  const counts = new Map<FamilySubskillGroup['state'], number>();
  for (const [, attribute] of Object.entries(view.attributes)) {
    const state = familyStateFor(attribute.status);
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }
  const groups = FAMILY_STATE_ORDER.flatMap((state) => {
    const count = counts.get(state);
    return count === undefined ? [] : [{ state, count }];
  });

  return {
    overall: { score: view.overall.domain_score },
    phase: { label: view.acara_phase },
    skill: view.skill,
    publishedAt: view.published_at,
    strengths,
    nextSteps,
    subskills: { state: 'groups', groups, total: Object.keys(view.attributes).length },
  };
}
