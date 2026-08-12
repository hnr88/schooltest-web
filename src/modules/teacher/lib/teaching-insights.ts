import type { InsightMastery } from '@/modules/teacher/types/teacher-result.types';
import type { MasteryBarView } from '@/modules/teacher/types/teaching-insights.types';

/**
 * C-TR-3's `mastery` is INVERTED BY CONSTRUCTION server-side: it counts students
 * who band `mastered`, so a SHORT bar IS the gap. This function therefore does
 * NOT re-invert and does NOT threshold anything — it converts the server's own
 * `ratio` (0..1) into the bar's width percentage and nothing else. The mastery
 * cuts live in `Config.teacher_mastery_bands` and were already applied when the
 * server counted (see `constants/mastery.constants.ts`).
 *
 * `assessed_count === 0` returns the not-assessed view: the attribute was never
 * administered to anybody with a complete profile, which is a different fact from
 * "no student mastered it" and must not be drawn as a zero-length bar.
 */
export function masteryBarView(entry: InsightMastery): MasteryBarView {
  if (entry.assessed_count === 0) return { assessed: false };
  return { assessed: true, percent: Math.round(entry.ratio * 100) };
}
