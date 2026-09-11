import { describe, expect, it } from 'vitest';

import {
  answerOf,
  durationOf,
  isExtended,
  isUnreached,
  keyAnswerOf,
  reviewInitials,
  reviewTally,
  secsOf,
  studentNameOf,
  submittedAgo,
  wordCount,
} from '@/modules/report/lib/review-display';
import { reviewStudentSchema } from '@/modules/report/schemas/review-student.schema';
import { resultReviewSchema } from '@/modules/teacher/schemas/teacher-review.schema';

import reading from './fixtures/result-review-reading.live.json';
import unreached from './fixtures/result-review-unreached.live.json';
import writing from './fixtures/result-review-writing.live.json';
import student from './fixtures/review-student.live.json';

// The review drawer's pure helpers over the two reviews recorded from the live
// API. Parsing them through the client's own strict schema first is itself a
// contract check: the web mirror accepts what the server actually sends.
const readingReview = resultReviewSchema.parse(reading.review);
const writingReview = resultReviewSchema.parse(writing.review);
const providerRow = writing.review.items.find((item) => item.correct_key.type === 'provider_scored');
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

  it('time comes from the served milliseconds, and a missing latency stays missing', () => {
    const ms = reading.review.items[0].latency_ms;
    expect(secsOf(ms)).toBe(Math.round(ms / 1000));
    expect(secsOf(null)).toBeNull();
    const writingSecs = Math.round((providerRow?.latency_ms ?? 0) / 1000);
    expect(durationOf(providerRow?.latency_ms ?? 0)).toEqual({
      minutes: Math.floor(writingSecs / 60),
      seconds: writingSecs % 60,
    });
  });

  it('counts the words of a live answer, and an empty one as none', () => {
    expect(wordCount((writing.review.items[0].given as { text: string }).text)).toBe(1);
    expect(wordCount('   ')).toBe(0);
  });

  it('initials take the first letter of the first two parts of the live student name', () => {
    const [first, second] = reading.context.studentName.split(/\s+/);
    expect(reviewInitials(reading.context.studentName)).toBe(`${first[0]}${second[0]}`.toUpperCase());
  });

  it('a row with no answer and no score is not reached, exactly as the live wire carries them', () => {
    const review = resultReviewSchema.parse(unreached.review);
    const served = unreached.review.items.filter((item) => item.given === null && item.is_correct === null);
    expect(served.length).toBeGreaterThan(0);
    expect(review.items.filter(isUnreached)).toHaveLength(served.length);
    expect(readingReview.items.some(isUnreached)).toBe(false);
    expect(writingReview.items.some(isUnreached)).toBe(false);
  });

  it('the student name joins the served name parts of the live record', () => {
    const record = reviewStudentSchema.parse(student.response).data;
    expect(studentNameOf(record)).toBe(`${record.given_name} ${record.family_name}`);
    expect(record.class?.name).toBe(student.response.data.class.name);
    expect(studentNameOf({ given_name: null, family_name: null })).toBeNull();
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
