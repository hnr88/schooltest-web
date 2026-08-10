import type { StatusPillTone } from '@/modules/design-system';
import type { MasteryBand } from '@/modules/teacher/types/teacher.types';

// NO MASTERY CUT LIVES HERE, DELIBERATELY — the same discipline
// `src/modules/report/constants/mastery.constants.ts` already carries, applied
// to the teacher surface.
//
// The spec's "green >= 80 / amber 50-79 / red < 50" is `Config.teacher_mastery_bands`
// (`{ mastered_cut: 0.8, approaching_cut: 0.5 }` on the active row) and
// `mastery_band(prob)` applies it SERVER-SIDE, writing the answer into the wire
// field `status` (.qa/CONTRACTS.md "Vocabulary"). The brief's requirement is
// literally "the 80% threshold is configurable server-side — don't hardcode it",
// so the portal colours a tile from `status` and prints `likelihood` verbatim.
// It never compares a likelihood to 80, to 50, or to the `bands` C-TR-2 echoes.
//
// WCAG 2.2 AA: a tone is never the only carrier of a band — every surface that
// uses this map also renders the band's own word.
export const MASTERY_BAND_TONE: Record<MasteryBand, StatusPillTone> = {
  mastered: 'success',
  approaching: 'warning',
  not_yet: 'danger',
  not_assessed: 'neutral',
};
