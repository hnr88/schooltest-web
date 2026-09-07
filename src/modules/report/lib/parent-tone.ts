import type { Band } from '@schooltest/scoring-contracts';

/**
 * §5 Screen D — the family-facing TONE layer, now on the v2 four-band contract
 * (task 35). The v1 module content was an empty import shell; these maps are
 * its actual purpose.
 *
 * The parent states are a positive ordinal over the v2 bands: the developing /
 * emerging distinction is teacher-facing measurement detail, and a family
 * audience gets "getting there" for both — while `not_yet` stays honest and
 * `not_assessed` stays an explicit absence. WCAG 1.4.1 discipline from the
 * teacher tiles applies unchanged: tint never carries meaning alone, the state
 * word is always printed beside it.
 */

export type ParentSubskillState = 'secure' | 'getting_there' | 'not_yet' | 'not_assessed';

export function bandToParentState(band: Band): ParentSubskillState {
  if (band === 'secure') return 'secure';
  if (band === 'developing' || band === 'emerging') return 'getting_there';
  if (band === 'not_yet') return 'not_yet';
  return 'not_assessed';
}

/** The templated strength/next-step copy per state (dashboard §5 "templated copy"). */
export const PARENT_STATE_PHRASE: Record<ParentSubskillState, string> = {
  secure: 'uses this skill reliably',
  getting_there: 'is getting there and benefits from support',
  not_yet: 'is still building this skill',
  not_assessed: 'was not assessed this sitting',
};
