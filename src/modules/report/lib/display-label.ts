import type { ReportSkill } from '@/modules/report/types/report.types';
import type {
  DisplayLabelState,
  ResolvedDisplayLabel,
} from '@/modules/report/types/report-view.types';
import { RECEPTIVE_SKILLS } from '@/modules/report/constants/lib.constants';

/**
 * The applicability rule reads ONE field — the skill — so that is what it asks
 * for. A full `ResultView` still satisfies it, and so does the v1 view the C-11
 * list serves for a `scoring_failed` or listening row (whose `skill` is
 * nullable, which this rule already handles).
 */
interface SkilledResult {
  skill: ReportSkill | null;
}

// One applicability rule for every crosswalk-derived field, plus the receptive
// MAP-posterior flag `low_confidence` (api::result.assembly writes it in the
// same update as the crosswalk fields, from R's receptive posterior). `value` is
// the field itself: present = 'derived', absent = 'pending' only where the
// server can still produce it.
export function getCrosswalkFieldState(
  result: SkilledResult,
  value: string | boolean | null,
): DisplayLabelState {
  if (value !== null) return 'derived';
  if (result.skill !== null && !RECEPTIVE_SKILLS.includes(result.skill)) return 'not_applicable';
  return 'pending';
}

export function getDisplayLabelState(result: SkilledResult & { acara_phase: string | null }): DisplayLabelState {
  return getCrosswalkFieldState(result, result.acara_phase);
}

// The single resolution every crosswalk phase surface reads from, so the crumb,
// the panel heading and any other rendering of the same result cannot disagree
// about which absence it is. The `!== null` re-check is TypeScript narrowing
// only — getCrosswalkFieldState answers 'derived' exactly when the field is
// non-null — never a substitute value.
export function resolveDisplayLabel(
  result: SkilledResult & { acara_phase: string | null }
): ResolvedDisplayLabel {
  const state = getDisplayLabelState(result);
  if (state === 'derived' && result.acara_phase !== null) {
    return { state: 'derived', label: result.acara_phase };
  }
  return state === 'pending'
    ? { state: 'pending', label: null, absentKey: 'displayLabelPending' }
    : { state: 'not_applicable', label: null, absentKey: 'displayLabelNotApplicable' };
}
