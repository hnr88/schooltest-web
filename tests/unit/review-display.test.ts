import { describe, expect, it } from 'vitest';

import {
  answerOf,
  isExtended,
  isUnreached,
  keyAnswerOf,
  reviewTally,
  submittedAgo,
} from '@/modules/report/lib/review-display';
import { resultReviewSchema, rubricOutputSchema } from '@/modules/teacher/schemas/teacher-review.schema';

import reading from './fixtures/result-review-reading.live.json';
import unreached from './fixtures/result-review-unreached.live.json';
import writing from './fixtures/result-review-writing.live.json';

// The review drawer's pure helpers over the two reviews recorded from the live
// API. Parsing them through the client's own strict schema first is itself a
// contract check: the web mirror accepts what the server actually sends.
const readingReview = resultReviewSchema.parse(reading.review);
const writingReview = resultReviewSchema.parse(writing.review);
const constructedRow = writing.review.items.find((item) => item.correct_key.type === 'constructed');

describe('review display helpers (live reviews)', () => {
  it('the strict client schema accepts both live payloads', () => {
    expect(readingReview.item_count).toBe(reading.review.items.length);
    expect(writingReview.item_count).toBe(writing.review.items.length);
  });

  it('an option pick prints its served option id; free text prints as written', () => {
    expect(answerOf(readingReview.items[0].given)).toEqual({
      kind: 'options',
      ids: [reading.review.items[0].given.option_id],
    });
    expect(answerOf(writingReview.items[0].given)).toEqual({
      kind: 'text',
      text: (writing.review.items[0].given as { text: string }).text,
    });
    expect(answerOf(null)).toEqual({ kind: 'none' });
  });

  it('prints the key for the single and constructed arms, never for a provider-scored one', () => {
    expect(keyAnswerOf(readingReview.items[0].correct_key)).toEqual({
      kind: 'options',
      ids: [reading.review.items[0].correct_key.answer],
    });
    const constructed = writingReview.items.find((item) => item.correct_key?.type === 'constructed');
    const provider = writingReview.items.find((item) => item.correct_key?.type === 'provider_scored');
    expect(keyAnswerOf(constructed?.correct_key ?? null)).toEqual({
      kind: 'text',
      text: (constructedRow?.correct_key as { accepted: string[] }).accepted.join(' / '),
    });
    expect(keyAnswerOf(provider?.correct_key ?? null)).toEqual({ kind: 'none' });
  });

  it('provider-scored rows are extended responses; option and key-scored text rows are not', () => {
    expect(readingReview.items.some(isExtended)).toBe(false);
    expect(writingReview.items.filter(isExtended)).toHaveLength(
      writing.review.items.filter((item) => item.correct_key.type === 'provider_scored').length,
    );
  });

  it('the tally counts served judgements over the question rows only', () => {
    expect(reviewTally(readingReview.items)).toEqual({
      correct: reading.review.items.filter((item) => item.is_correct === true).length,
      total: reading.review.items.length,
    });
    const keyed = writing.review.items.filter((item) => item.correct_key.type !== 'provider_scored');
    expect(reviewTally(writingReview.items)).toEqual({
      correct: keyed.filter((item) => item.is_correct === true).length,
      total: keyed.length,
    });
  });

  it('a row with no answer and no score is not reached, exactly as the live wire carries them', () => {
    const review = resultReviewSchema.parse(unreached.review);
    const served = unreached.review.items.filter((item) => item.given === null && item.is_correct === null);
    expect(served.length).toBeGreaterThan(0);
    expect(review.items.filter(isUnreached)).toHaveLength(served.length);
    expect(readingReview.items.some(isUnreached)).toBe(false);
    expect(writingReview.items.some(isUnreached)).toBe(false);
  });

  it('submitted-ago picks the largest whole unit from a live timestamp', () => {
    const at = new Date(reading.recordedAt).getTime();
    expect(submittedAgo(reading.recordedAt, new Date(at + 30_000))).toEqual({ unit: 'now' });
    expect(submittedAgo(reading.recordedAt, new Date(at + 6 * 60_000))).toEqual({ unit: 'minutes', count: 6 });
    expect(submittedAgo(reading.recordedAt, new Date(at + 3 * 3_600_000))).toEqual({ unit: 'hours', count: 3 });
    expect(submittedAgo(reading.recordedAt, new Date(at + 2 * 86_400_000))).toEqual({ unit: 'days', count: 2 });
    expect(submittedAgo('not a timestamp', new Date(at))).toBeNull();
  });
});

// ST4S W5-04 (G-41): `model_served` and `prompt_sha256` are OPTIONAL provenance
// keys on the strict rubric body. The live fixture was recorded before any row
// carried a scored body (every `rubric_score` in it is null: no gateway is
// reachable on the recording box), so the scored bodies below are built on the
// fixture's own provider-scored row, using its rubric_ref and the student's own
// recorded text as the quote, and add ONLY the two keys under test.
describe('rubric_score provenance keys (additive)', () => {
  const row = writing.review.items.find((item) => item.correct_key.type === 'provider_scored');
  const text = (row?.given as { text: string }).text;
  const legacy = {
    provider: 'writing_llm' as const,
    rubric_ref: (row?.correct_key as unknown as { rubric_ref: string }).rubric_ref,
    rubric_version: 0,
    model: 'writing-alias',
    scored_at: writing.recordedAt,
    dimensions: { task_achievement: 3 },
    rationale: { task_achievement: 'Answers the prompt.' },
    evidence: { task_achievement: text.slice(0, 40) },
  };
  const withRow = (rubricScore: unknown) => ({
    ...writing.review,
    items: writing.review.items.map((item) =>
      item.response_document_id === row?.response_document_id ? { ...item, rubric_score: rubricScore } : item,
    ),
  });
  const sha = 'a'.repeat(64);

  it('a legacy body without either key still parses, inside the whole review too', () => {
    expect(rubricOutputSchema.safeParse(legacy).success).toBe(true);
    expect(resultReviewSchema.safeParse(withRow(legacy)).success).toBe(true);
  });

  it('a body carrying both keys parses and keeps them', () => {
    const body = { ...legacy, model_served: 'bedrock-served-model', prompt_sha256: sha };
    const parsed = resultReviewSchema.parse(withRow(body));
    const stored = parsed.items.find((item) => item.response_document_id === row?.response_document_id);
    expect(stored?.rubric_score).toMatchObject({ model_served: 'bedrock-served-model', prompt_sha256: sha });
  });

  it('a malformed prompt_sha256 fails, and the strictness elsewhere is unchanged', () => {
    expect(rubricOutputSchema.safeParse({ ...legacy, prompt_sha256: 'a'.repeat(63) }).success).toBe(false);
    expect(rubricOutputSchema.safeParse({ ...legacy, prompt_sha256: 'A'.repeat(64) }).success).toBe(false);
    expect(rubricOutputSchema.safeParse({ ...legacy, model_served: '' }).success).toBe(false);
    expect(rubricOutputSchema.safeParse({ ...legacy, prompt_sha256: sha, unlisted: 1 }).success).toBe(false);
  });
});
