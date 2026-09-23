import { attributeNameSchema, type AttributeName } from '@schooltest/scoring-contracts';

import { MASTERY_AREA_CODES } from '@/modules/teach/constants/lib.constants';

import type { DiagnosticAttribute } from '@/modules/teach/types/diagnostic.types';
import type { MasteryAreaCode } from '@/modules/teach/types/lib.types';

// The eight teach areas. A live class diagnostic names a scored student's cells by model attribute
// and an unscored student's by area code; this places either on its area. Everyday (Vocab_A2) and
// Classroom (Vocab_B1) Vocabulary are areas of their own, never one Vocabulary. Anything else — the
// not-yet-assessed group sentinel, a non-reading code — has no reading area: null.
const AREA_OF_ATTRIBUTE: Readonly<Record<AttributeName, MasteryAreaCode>> = {
  Decoding: 'R1',
  Vocab_A2: 'Vocab_A2',
  Grammar: 'R3',
  Vocab_B1: 'Vocab_B1',
  Gist: 'R4',
  Detail: 'R5',
  Inference: 'R6',
};

// The pre-split vocabulary code: an unscored student's placeholder, or a legacy row's retired
// joint-model figure.
const LEGACY_VOCABULARY_CODE = 'R2';

const VOCABULARY_AREAS: readonly MasteryAreaCode[] = ['Vocab_A2', 'Vocab_B1'];

// An area's label as a full i18n key: the two vocabulary strands take the report's own attribute
// names, every other area (and a legacy R2 group) its `Teach.diagnostic.areas.*` label.
const AREA_LABEL_KEY: Readonly<Partial<Record<string, string>>> = {
  Vocab_A2: 'Report.attributes.Vocab_A2',
  Vocab_B1: 'Report.attributes.Vocab_B1',
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

/**
 * Every area one wire cell counts on. An `R2` cell saying "not assessed" is true of both strands,
 * so it lands on both; an `R2` carrying a real status is the retired joint model's single figure,
 * evidence for neither strand, so it lands on none.
 */
export function diagnosticAreaCodes(attribute: DiagnosticAttribute): readonly MasteryAreaCode[] {
  if (attribute.code === LEGACY_VOCABULARY_CODE) {
    return attribute.status === 'not_assessed' ? VOCABULARY_AREAS : [];
  }
  const area = diagnosticAreaCode(attribute.code);
  return area === null ? [] : [area];
}

export function areaLabelKey(code: string): string {
  return AREA_LABEL_KEY[code] ?? `Teach.diagnostic.areas.${code}`;
}
