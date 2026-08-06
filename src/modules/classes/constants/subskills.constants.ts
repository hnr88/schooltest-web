import { SUBSKILL_KEYS } from '@/modules/classes/schemas/class-detail.schema';
import type { SubskillKey, TestSlot } from '@/modules/classes/types/class-detail.types';

// The spec's fixed display order for the drill-down tile grid — decoding,
// vocabulary, grammar, gist, detail, inference, critical — and the A-then-B
// column order of the class table. Defined ONCE (the schema's key tuple is the
// same source the parser validates against), so no component re-types an order.
export const SUBSKILL_ORDER: readonly SubskillKey[] = SUBSKILL_KEYS;

export const TEST_SLOTS: readonly TestSlot[] = ['A', 'B'];
