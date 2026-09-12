import { attributeNameSchema } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER, displaySkillOfAttribute } from '@/modules/results';
import { MASTERY_AREA_CODES } from '@/modules/teach/constants/lib.constants';

import type { MasteryAreaCode } from '@/modules/teach/types/lib.types';

// The seven teach areas R1..R7 (`Teach.diagnostic.areas.*`) are the seven display skills in
// display order. A live class diagnostic names a scored student's cells by model attribute and
// an unscored student's by area code; this places either on its area (the two vocabulary
// strands on Vocabulary, through the results display mapping). Anything else — the
// not-yet-assessed group sentinel, a non-reading code — has no reading area: null.
function isAreaCode(code: string): code is MasteryAreaCode {
  return (MASTERY_AREA_CODES as readonly string[]).includes(code);
}

export function diagnosticAreaCode(code: string): MasteryAreaCode | null {
  if (isAreaCode(code)) return code;
  const attribute = attributeNameSchema.safeParse(code);
  if (!attribute.success) return null;
  return MASTERY_AREA_CODES[DISPLAY_SKILL_ORDER.indexOf(displaySkillOfAttribute(attribute.data))] ?? null;
}
