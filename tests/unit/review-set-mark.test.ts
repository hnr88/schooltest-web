import { describe, expect, it } from 'vitest';

import {
  reviewMarkDecision,
  reviewMarkPayload,
  reviewResetPayload,
  reviewSourceForValue,
} from '@/modules/report/queries/use-result-review.mutation';

describe('review setMark guards', () => {
  it('requires a destructive confirmation for zero on a declined response', () => {
    expect(reviewMarkDecision({ value: 0, suggested: 0, max: 6, declined: true })).toEqual({
      kind: 'confirm',
      tone: 'destructive',
    });
  });

  it('requires neutral confirmation two or more below the suggestion', () => {
    expect(reviewMarkDecision({ value: 2, suggested: 4, max: 6, declined: false })).toEqual({
      kind: 'confirm',
      tone: 'neutral',
    });
  });

  it('requires neutral confirmation at a fully met ceiling', () => {
    expect(reviewMarkDecision({ value: 6, suggested: 6, max: 6, declined: false })).toEqual({
      kind: 'confirm',
      tone: 'neutral',
    });
  });

  it('commits ordinary marks, including more than one point above a suggestion', () => {
    expect(reviewMarkDecision({ value: 3, suggested: 2, max: 6, declined: false })).toEqual({
      kind: 'commit',
    });
    expect(reviewMarkDecision({ value: 5, suggested: 2, max: 6, declined: false })).toEqual({
      kind: 'commit',
    });
  });
});

describe('review mark payloads', () => {
  const scored = {
    provider: 'writing_llm',
    rubric_ref: 'wr_c10_provisional_v0',
    rubric_version: 0,
    model: 'test',
    scored_at: '2026-09-10T00:00:00.000Z',
    dimensions: { idea: 2, evidence: 1 },
  } as const;

  it('maps a mark equal to the suggestion to accepted, anything else to overridden', () => {
    expect(reviewSourceForValue({ rubric_score: scored }, 3)).toBe('accepted');
    expect(reviewSourceForValue({ rubric_score: scored }, 2)).toBe('overridden');
    expect(reviewSourceForValue({ rubric_score: null }, 2)).toBe('overridden');
  });

  it('sends the assist decline_kind only beside the declined source', () => {
    const blank = { ...scored, decline_kind: 'blank' as const, decline_reason: 'x', dimensions: null };
    expect(reviewMarkPayload({ response_document_id: 'r1', rubric_score: blank }, null, 'declined')).toEqual({
      response_document_id: 'r1',
      teacher_mark: null,
      teacher_mark_source: 'declined',
      decline_kind: 'blank',
    });
    const over = { ...scored, decline_kind: 'over_ceiling' as const, decline_reason: 'x' };
    expect(
      reviewMarkPayload({ response_document_id: 'r2', rubric_score: over }, 3, 'overridden'),
    ).toEqual({
      response_document_id: 'r2',
      teacher_mark: 3,
      teacher_mark_source: 'overridden',
    });
  });

  it('resets by clearing the mark key, never by writing a zero', () => {
    expect(reviewResetPayload({ response_document_id: 'r3' })).toEqual({
      response_document_id: 'r3',
      teacher_mark: null,
      teacher_mark_source: null,
    });
  });
});
