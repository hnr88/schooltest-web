import { describe, expect, it } from 'vitest';

import { reviewMarkDecision } from '@/modules/report/queries/use-result-review.mutation';

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
