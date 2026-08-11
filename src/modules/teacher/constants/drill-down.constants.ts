import type { MasteryBand } from '@/modules/teacher/types/teacher.types';

// NO MASTERY CUT LIVES HERE EITHER — see `constants/mastery.constants.ts` for the
// full statement of the discipline. These two maps are keyed by the WIRE band
// C-TR-2 sends in each subskill's `status` field, which `mastery_band(prob)`
// already derived server-side from `Config.teacher_mastery_bands`. Nothing in this
// file (or in anything that reads it) sees a likelihood number at all, so no code
// path can compare one to 80 or to 50.

/**
 * The tile's surface + ink per band (.qa/DESIGN.md token mapping: green mastered,
 * amber approaching, red not yet, grey no data). `*-ink` foregrounds, not the
 * 500-level ones — the soft tints only clear AA with the ink pair.
 *
 * WCAG 2.2 AA 1.4.1: the tint is NEVER the only carrier. Every tile that uses
 * this map also prints the band's own word (`MASTERY_BAND_LABEL_KEY`).
 */
export const MASTERY_BAND_TILE_CLASS: Record<MasteryBand, string> = {
  mastered: 'bg-success-soft text-success-ink',
  approaching: 'bg-warning-soft text-warning-ink',
  not_yet: 'bg-danger-soft text-danger-ink',
  not_assessed: 'bg-muted text-secondary-foreground',
};

/** The band's WORD, under `Teacher.results.drillDown` — the text half of 1.4.1. */
export const MASTERY_BAND_LABEL_KEY: Record<MasteryBand, string> = {
  mastered: 'bandMastered',
  approaching: 'bandApproaching',
  not_yet: 'bandNotYet',
  not_assessed: 'bandNotAssessed',
};
