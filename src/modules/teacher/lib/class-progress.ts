import { PROGRESS_ACARA_CARD_ORDER } from '@/modules/teacher/constants/class-progress.constants';
import type {
  ProgressAcaraCard,
  ProgressDirection,
  ProgressReadCounts,
  ProgressReadStatus,
  ProgressView,
} from '@/modules/teacher/types/class-progress.types';
import type {
  AcaraMovement,
  ClassProgressResponse,
} from '@/modules/teacher/types/teacher-progress.types';

/**
 * The SIGN of a difference the server already computed. It compares to ZERO and
 * to nothing else — the mastery cuts (`Config.teacher_mastery_bands`) were
 * applied server-side before `a_mastered`/`b_mastered`/`change` were counted, and
 * this file never sees a likelihood, an 80 or a 50.
 */
export function progressDirection(value: number): ProgressDirection {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

/**
 * A server-sent difference split into the two things the UI shows: its direction
 * (the WORD and the tone) and its magnitude (the number). Splitting it here is
 * what keeps `Math.abs` out of the components — the value itself is never
 * changed, only presented.
 */
export function progressDelta(value: number): { direction: ProgressDirection; magnitude: number } {
  return { direction: progressDirection(value), magnitude: Math.abs(value) };
}

/** Error beats pending beats the server's own `available` flag. */
export function deriveProgressStatus(read: ProgressReadCounts): ProgressReadStatus {
  if (read.isError) return 'error';
  if (read.isLoading || !read.isSuccess || !read.data) return 'loading';
  const view = progressView(read.data);
  if (view.kind === 'ready') return 'ready';
  return view.kind === 'drift' ? 'drift' : 'unavailable';
}

/**
 * C-TR-4 → the shape each branch renders.
 *
 * `available: false` yields `unavailable` and KEEPS `cohort`: the empty state's
 * "Test A n / N · Test B 0 / N" line is the server's real completion count, not a
 * placeholder. `available: true` with a `null` summary or `null` acara_movement is
 * contract drift (C-TR-4 pairs the flag with those objects), so it yields `drift`
 * and the tab reports it — zeros are never substituted for a body it cannot
 * trust, and no aggregate is recomputed here from the arrays.
 */
export function progressView(data: ClassProgressResponse): ProgressView {
  if (!data.available) return { kind: 'unavailable', cohort: data.cohort };
  if (!data.summary || !data.acara_movement) return { kind: 'drift', cohort: data.cohort };

  return {
    kind: 'ready',
    cohort: data.cohort,
    summary: data.summary,
    movement: data.acara_movement,
    shift: data.subskill_shift,
    mostImproved: data.most_improved,
    needsAttention: data.needs_attention,
    compared: data.summary.improved + data.summary.unchanged + data.summary.regressed,
  };
}

/**
 * The three cards of .qa/DESIGN.md §Progress tab, in wireframe order, each with
 * the server's own `from → to` breakdown. The phase NAMES are echoed verbatim
 * from C-TR-4 (`up_detail`/`down_detail`) — there is no client-side phase table.
 */
export function acaraMovementCards(movement: AcaraMovement): ProgressAcaraCard[] {
  return PROGRESS_ACARA_CARD_ORDER.map((key) => {
    if (key === 'up') {
      return { key, count: movement.up, detail: movement.up_detail, improvedWithinPhase: null };
    }
    if (key === 'down') {
      return { key, count: movement.down, detail: movement.down_detail, improvedWithinPhase: null };
    }
    return {
      key,
      count: movement.same,
      detail: [],
      improvedWithinPhase: movement.same_improved_within_phase,
    };
  });
}
