import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { resolveDisplayLabel, splitDisplayLabel } from '@/modules/report/lib/display-label';
import { PARENT_SUBSKILL_ORDER, PARENT_TONE_BY_STATUS } from '@/modules/report/lib/parent-tone';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';
import type {
  ParentHeadline,
  ParentReportView,
  ParentSubskillGroup,
  ParentSubskillState,
  ParentSubskillsView,
} from '@/modules/report/types/report-view.types';
import type { ResultView } from '@/modules/report/types/report.types';

// The seeded Crosswalk composes `display_label` as "{label} ({qualifiers})", and
// a live qualifier is "misses stated detail" while Doc 2a s.9 names "B1
// vocabulary gap" — deficit phrasing and a CEFR band code. The parent headline is
// the RUNG ALONE, through the same split the teacher panel already performs.
// Nothing is re-worded and nothing is re-derived.
function buildHeadline(result: ResultView): ParentHeadline {
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
function buildSubskills(result: ResultView): ParentSubskillsView {
  const panel = buildAttributePanel(result);
  if (panel.state !== 'rows') return { state: panel.state };
  return { state: 'groups', groups: groupSubskills(panel.rows), total: panel.rows.length };
}

// E11-14/E11-15(a). The ONLY constructor of the parent surface's data. It reads
// `display_label`, `skill`, `published_at` and `attributes` — and nothing else
// off the ResultView, so `readiness`, `cefr_band`, `acara_phase`,
// `low_confidence`, `provisional`, `supplementary` and every attribute code and
// probability are absent from the parent rendering STRUCTURALLY, not by a
// conditional a later edit could drop.
export function buildParentReport(result: ResultView): ParentReportView {
  return {
    headline: buildHeadline(result),
    skill: result.skill,
    publishedAt: result.published_at,
    subskills: buildSubskills(result),
  };
}
