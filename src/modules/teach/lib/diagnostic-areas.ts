import { attributeNameSchema, type AttributeName } from '@schooltest/scoring-contracts';

import { MASTERY_AREA_CODES } from '@/modules/teach/constants/lib.constants';

import type { MasteryAreaCode } from '@/modules/teach/types/lib.types';

// The seven teach areas R1..R7 (`Teach.diagnostic.areas.*`). A live class diagnostic names a
// scored student's cells by model attribute and an unscored student's by area code; this places
// either on its area (both vocabulary strands on the one Vocabulary area, R2). Anything else — the
// not-yet-assessed group sentinel, a non-reading code — has no reading area: null.
const AREA_OF_ATTRIBUTE: Readonly<Record<AttributeName, MasteryAreaCode>> = {
  Decoding: 'R1',
  Vocab_A2: 'R2',
  Grammar: 'R3',
  Vocab_B1: 'R2',
  Gist: 'R4',
  Detail: 'R5',
  Inference: 'R6',
};

function isAreaCode(code: string): code is MasteryAreaCode {
  return (MASTERY_AREA_CODES as readonly string[]).includes(code);
}

export function diagnosticAreaCode(code: string): MasteryAreaCode | null {
  if (isAreaCode(code)) return code;
  const attribute = attributeNameSchema.safeParse(code);
  if (!attribute.success) return null;
  return AREA_OF_ATTRIBUTE[attribute.data];
}
