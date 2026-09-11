import type {
  ReviewAnswer,
  ReviewCriterion,
  ReviewMarkState,
  ReviewSubmittedAgo,
  ReviewTally,
} from '@/modules/report/types/review.types';
import type { ReviewItem, RubricOutput } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/11 — presentation helpers for the review drawer. They live here
// rather than in the components because they use no hooks and the module
// pattern puts pure functions in lib/. Every one reads a served value; none
// invents one.

/**
 * Whole seconds from the stored milliseconds (the design prints "48s on this
 * question"). The unit conversion is a PRESENTATION concern, which is why the
 * wire keeps `latency_ms`. `null` stays `null` — a missing latency is not zero.
 */
export const secsOf = (latencyMs: number | null): number | null =>
  latencyMs === null ? null : Math.round(latencyMs / 1000);

/** Minutes and seconds of a stored latency, for "written in 6 min 40 s". */
export function durationOf(latencyMs: number): { minutes: number; seconds: number } {
  const total = Math.round(latencyMs / 1000);
  return { minutes: Math.floor(total / 60), seconds: total % 60 };
}

/**
 * Whether the marking assist DECLINED to suggest a mark. Only a blank attempt
 * and a language switch decline; above-the-ceiling and a different question
 * carry a NOTE and still suggest, because there is real evidence to mark.
 */
export const isDeclined = (rubric: RubricOutput): boolean =>
  rubric.decline_kind === 'blank' || rubric.decline_kind === 'language';

/** Correct answers among the served rows — a COUNT of server judgements. */
export const correctCount = (items: readonly { is_correct: boolean | null }[]): number =>
  items.filter((item) => item.is_correct === true).length;

/**
 * An EXTENDED response is a rubric-marked row: it carries a marking-assist
 * body, or its key hands scoring to the writing provider. A key-scored text
 * answer (a gap fill) is an ordinary question row with a key to show.
 */
export const isExtended = (item: Pick<ReviewItem, 'rubric_score' | 'correct_key'>): boolean =>
  item.rubric_score !== null || item.correct_key?.type === 'provider_scored';

/**
 * A row the student never reached: no answer recorded and nothing scored. The
 * live wire carries not-reached rows exactly this way (the stored `not_reached`
 * flag itself is not served), so the drawer reads it rather than guessing.
 */
export const isUnreached = (
  item: Pick<ReviewItem, 'given' | 'is_correct' | 'rubric_score' | 'correct_key'>,
): boolean => item.given === null && item.is_correct === null && !isExtended(item);

/** The student's display name from their own record's served name parts. */
export const studentNameOf = (student: {
  given_name: string | null;
  family_name: string | null;
}): string | null => [student.given_name, student.family_name].filter(Boolean).join(' ') || null;

/** The header tally: served judgements over the question rows only. */
export function reviewTally(items: readonly ReviewItem[]): ReviewTally {
  const rows = items.filter((item) => !isExtended(item));
  return { correct: correctCount(rows), total: rows.length };
}

/** The suggested mark: the sum of the served bands, or `null` on a decline / no assist. */
export function suggestedMark(item: Pick<ReviewItem, 'rubric_score'>): number | null {
  const dimensions = item.rubric_score?.dimensions;
  if (dimensions === null || dimensions === undefined) return null;
  return Object.values(dimensions).reduce((total, band) => total + band, 0);
}

/** Where an extended response stands — read from the stored mark, never guessed. */
export function markState(item: ReviewItem): ReviewMarkState {
  const declined = item.rubric_score !== null && isDeclined(item.rubric_score);
  if (item.teacher_mark === null || item.teacher_mark === undefined) {
    return declined ? 'judgement' : 'awaiting';
  }
  return item.teacher_mark_source === 'accepted' ? 'accepted' : 'marked';
}

/** The rubric rows the assist served, in served order. */
export function rubricCriteria(item: ReviewItem): ReviewCriterion[] {
  const rubric = item.rubric_score;
  const dimensions = rubric?.dimensions;
  if (!rubric || dimensions === null || dimensions === undefined) return [];
  const max = item.mark_max ?? null;
  const atCeiling = max !== null && suggestedMark(item) === max;
  return Object.entries(dimensions).map(([name, level]) => ({
    name,
    level,
    max: atCeiling ? level : null,
    tone: level === 0 ? 'zero' : atCeiling ? 'full' : 'unknown',
    reason: rubric.rationale?.[name] ?? null,
    evidence: level > 0 ? (rubric.evidence?.[name] ?? null) : null,
  }));
}

const stringsOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

/** A served answer, in the shapes the live wire carries: an option pick or free text. */
export function answerOf(given: unknown): ReviewAnswer {
  if (typeof given === 'string') {
    return given.trim() === '' ? { kind: 'none' } : { kind: 'text', text: given };
  }
  if (given === null || typeof given !== 'object') return { kind: 'none' };
  const record = given as Record<string, unknown>;
  if (typeof record.option_id === 'string') return { kind: 'options', ids: [record.option_id] };
  if (typeof record.text === 'string') {
    return record.text.trim() === '' ? { kind: 'none' } : { kind: 'text', text: record.text };
  }
  return { kind: 'text', text: JSON.stringify(given) };
}

/** The answer key, for the key arms whose answer is printable. */
export function keyAnswerOf(key: ReviewItem['correct_key']): ReviewAnswer {
  if (key === null) return { kind: 'none' };
  const record = key as Record<string, unknown>;
  if (key.type === 'single' && typeof record.answer === 'string') {
    return { kind: 'options', ids: [record.answer] };
  }
  const accepted = key.type === 'constructed' ? stringsOf(record.accepted) : [];
  return accepted.length > 0 ? { kind: 'text', text: accepted.join(' / ') } : { kind: 'none' };
}

export const wordCount = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const hasText = (value: string | null | undefined): boolean => (value ?? '').trim() !== '';

/** The design's avatar initials: the first letter of the first two name parts. */
export const reviewInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** How long ago an ISO timestamp was, in the largest whole unit the header prints. */
export function submittedAgo(iso: string, now: Date): ReviewSubmittedAgo | null {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const minutes = Math.floor((now.getTime() - at) / 60_000);
  if (minutes < 1) return { unit: 'now' };
  if (minutes < 60) return { unit: 'minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? { unit: 'hours', count: hours } : { unit: 'days', count: Math.floor(hours / 24) };
}
