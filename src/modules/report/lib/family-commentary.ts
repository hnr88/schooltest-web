import { attributeNameSchema, type Band } from '@schooltest/scoring-contracts';

import { bandToParentState } from '@/modules/report/lib/parent-tone';
import { CARER_CAN_KEY, CARER_NEXT_KEY } from '@/modules/teacher/constants/v2-i18n.constants';

/**
 * The family face's "What this means": one plain-language line per assessed skill, in display
 * order, as a `TeacherPortal.viewModel` message key — the same carer can-do / work-on sentences
 * the teacher previews as what the carer sees. Built from the structured attributes (key + band),
 * so it renders in the family's locale and carries no probability, no evidence count, no CEFR code
 * and no internal attribute key. A skill not assessed this sitting gets no line: an absence of
 * evidence is neither a strength nor a next step.
 */
export function familyCommentaryKeys(attributes: Record<string, { status: Band }>): string[] {
  return attributeNameSchema.options.flatMap((name) => {
    const entry = attributes[name];
    if (entry === undefined) return [];
    const state = bandToParentState(entry.status);
    if (state === 'not_assessed') return [];
    return [state === 'not_yet' ? CARER_NEXT_KEY[name] : CARER_CAN_KEY[name]];
  });
}
