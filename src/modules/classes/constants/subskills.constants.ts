import { SUBSKILL_KEYS } from '@/modules/classes/schemas/class-detail.schema';
import type { SubskillKey, TestSlot } from '@/modules/classes/types/class-detail.types';

// The fixed display order for the drill-down tile grid — decoding, Everyday
// Vocabulary, grammar, Classroom Vocabulary, gist, detail, inference, critical —
// and the A-then-B column order of the class table. Defined ONCE (the schema's
// key tuple is the same source the parser validates against), so no component
// re-types an order.
export const SUBSKILL_ORDER: readonly SubskillKey[] = SUBSKILL_KEYS;

// Full i18n key of each tile's label. The two vocabulary strands take the
// report's own attribute names (Report.attributes.Vocab_A2 / Vocab_B1).
export const SUBSKILL_LABEL_KEY: Readonly<Record<SubskillKey, string>> = {
  decoding: 'Classes.studentDetail.subskill.decoding',
  vocab_a2: 'Report.attributes.Vocab_A2',
  grammar: 'Classes.studentDetail.subskill.grammar',
  vocab_b1: 'Report.attributes.Vocab_B1',
  gist: 'Classes.studentDetail.subskill.gist',
  detail: 'Classes.studentDetail.subskill.detail',
  inference: 'Classes.studentDetail.subskill.inference',
  critical: 'Classes.studentDetail.subskill.critical',
};

export const TEST_SLOTS: readonly TestSlot[] = ['A', 'B'];
