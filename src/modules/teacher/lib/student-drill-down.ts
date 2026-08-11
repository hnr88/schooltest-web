import type { StudentSubskill } from '@/modules/teacher/types/teacher-result.types';
import type { SubskillTileView } from '@/modules/teacher/types/student-drill-down.types';

/**
 * Chooses which of the two tile arms one C-TR-2 subskill may be drawn as.
 *
 * This is the ONLY branch the drill-down makes over a subskill, and it is a
 * PRESENCE test, never a threshold: `likelihood === null` (the `'not_assessed'`
 * sentinel, per .qa/CONTRACTS.md "Vocabulary") means this result never measured
 * the attribute, so the tile prints no percentage. Otherwise the server's own
 * integer `likelihood` and the server's own `status` band are passed through
 * verbatim.
 *
 * The 80% / 50% mastery cuts are `Config.teacher_mastery_bands` and were applied
 * server-side by `mastery_band(prob)` before `status` was ever sent. Deriving a
 * band here — from `likelihood`, or from the `bands` C-TR-2 echoes for the legend
 * — would be exactly the hardcoded threshold the brief forbids.
 */
export function subskillTileView(subskill: StudentSubskill): SubskillTileView {
  if (subskill.likelihood === null) return { measured: false, status: subskill.status };
  return { measured: true, likelihood: subskill.likelihood, status: subskill.status };
}
