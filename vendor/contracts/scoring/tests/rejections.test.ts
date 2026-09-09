/**
 * One rejection test per validation rule in spec v2 §4.2. Each starts from the
 * valid `score-resp.json` and breaks exactly one thing, so a pass proves the
 * rule and not an unrelated typo.
 *
 * The §4.2 rules that need the REQUEST to check (session_key, model_version and
 * reference_sets_version equality, items_scored vs the reached-core count) are
 * the worker's pre-persist comparison, not a shape rule, and belong to task 14.
 */
import { describe, expect, it } from 'vitest';

import {
  notAssessedSchema,
  resultViewSchema,
  scoreRequestSchema,
  scoreResponseSchema,
  storedResultSchema,
} from '../src/index';

import resultViewFixture from '../fixtures/result-view.json';
import scoreReqFixture from '../fixtures/score-req.json';
import scoreRespFixture from '../fixtures/score-resp.json';
import storedResultFixture from '../fixtures/stored-result.json';

/** A deep clone typed loosely so a test can break one field. */
function broken<T>(fixture: T): any {
  return JSON.parse(JSON.stringify(fixture));
}

describe('spec v2 §4.2 — score-resp/1 rejections', () => {
  it('rejects prob 1.2 — every prob is in [0, 1]', () => {
    const body = broken(scoreRespFixture);
    body.attribute_posteriors.Decoding.prob = 1.2;
    const parsed = scoreResponseSchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(['attribute_posteriors', 'Decoding', 'prob']);
  });

  it('rejects domain_score 101 — every domain score is in [0, 100]', () => {
    const body = broken(scoreRespFixture);
    body.attribute_scores.Decoding.domain_score = 101;
    const parsed = scoreResponseSchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual([
      'attribute_scores',
      'Decoding',
      'domain_score',
    ]);
  });

  it('rejects se -1 — every se is >= 0', () => {
    const body = broken(scoreRespFixture);
    body.attribute_scores.Decoding.se = -1;
    const parsed = scoreResponseSchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(['attribute_scores', 'Decoding', 'se']);
  });

  it('rejects a profile_posterior of length 5 — Matrix 1 has exactly four profiles', () => {
    const body = broken(scoreRespFixture);
    body.matrix_1.profile_posterior = [0.2, 0.2, 0.2, 0.2, 0.2];
    const parsed = scoreResponseSchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(['matrix_1', 'profile_posterior']);
  });

  it('rejects an attribute_posteriors / attribute_scores key-set mismatch', () => {
    const body = broken(scoreRespFixture);
    delete body.attribute_scores.Inference;
    const parsed = scoreResponseSchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(['attribute_scores']);
  });

  it('rejects a profile posterior that does not sum to 1', () => {
    const body = broken(scoreRespFixture);
    body.matrix_1.profile_posterior = [0.02, 0.05, 0.13, 0.5];
    expect(scoreResponseSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a MAP profile that is not admissible ([0, 1, 0])', () => {
    const body = broken(scoreRespFixture);
    body.matrix_1.map_profile = [0, 1, 0];
    expect(scoreResponseSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a reordered attribute echo — R echoes the canonical order', () => {
    const body = broken(scoreRespFixture);
    body.matrix_1.attributes = ['Vocab_A2', 'Decoding', 'Grammar'];
    expect(scoreResponseSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a missing scale_score when items_scored > 0', () => {
    const body = broken(scoreRespFixture);
    delete body.scale_score;
    const parsed = scoreResponseSchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(['scale_score']);
  });

  it('rejects an unknown attribute key and a wrong schema_version', () => {
    const withStrayKey = broken(scoreRespFixture);
    withStrayKey.attribute_posteriors.R7 = { prob: 0.5, prob_se: 0.1, items_seen: 4 };
    expect(scoreResponseSchema.safeParse(withStrayKey).success).toBe(false);

    const wrongVersion = broken(scoreRespFixture);
    wrongVersion.schema_version = 'score-resp/2';
    expect(scoreResponseSchema.safeParse(wrongVersion).success).toBe(false);
  });

  it('accepts the stage-3-not-reached gate, and only that shape', () => {
    const notReached = broken(scoreRespFixture);
    notReached.gate = { passed: null };
    expect(scoreResponseSchema.safeParse(notReached).success).toBe(true);

    // A theta with no stage-3 items behind it would be an invented value.
    const halfPopulated = broken(scoreRespFixture);
    halfPopulated.gate = { passed: null, theta: 0.41 };
    expect(scoreResponseSchema.safeParse(halfPopulated).success).toBe(false);
  });
});

describe('score-req/1 rejections', () => {
  it('rejects a Matrix 1 Q-row that is four wide', () => {
    const body = broken(scoreReqFixture);
    body.responses[0].attribute_vector = [1, 0, 0, 0];
    expect(scoreRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a stage-3 row that claims a matrix — memo §1 holds it out of the CDM', () => {
    const body = broken(scoreReqFixture);
    body.responses[3].matrix = 2;
    expect(scoreRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects rapid_guess on the wire — memo §6 keeps it out of scoring', () => {
    const body = broken(scoreReqFixture);
    body.responses[0].rapid_guess = false;
    expect(scoreRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects the v1 unversioned envelope outright', () => {
    expect(
      scoreRequestSchema.safeParse({
        session_key: 'sess-fixture-0001',
        student_key: 'stu-1',
        skill: 'reading',
        model: 'dina',
        attribute_names: ['R1'],
        hierarchy: {},
        q_matrix: [],
        responses: [],
        item_params: [],
        blocks: [],
        prior: 'uniform_valid',
      }).success
    ).toBe(false);
  });
});

describe('not-assessed is always the object form', () => {
  it('rejects the bare "not_assessed" string everywhere it used to be accepted', () => {
    expect(notAssessedSchema.safeParse('not_assessed').success).toBe(false);

    const stored = broken(storedResultFixture);
    stored.attributes.Gist = 'not_assessed';
    expect(storedResultSchema.safeParse(stored).success).toBe(false);

    const view = broken(resultViewFixture);
    view.attributes.Gist = 'not_assessed';
    expect(resultViewSchema.safeParse(view).success).toBe(false);
  });

  it('requires items_seen on the object form and forbids `items`', () => {
    expect(notAssessedSchema.safeParse({ status: 'not_assessed' }).success).toBe(false);
    expect(notAssessedSchema.safeParse({ status: 'not_assessed', items: 2 }).success).toBe(false);
    expect(notAssessedSchema.safeParse({ status: 'not_assessed', items_seen: 2 }).success).toBe(
      true
    );
  });

  it('rejects a scored attribute carrying `items` instead of `items_seen`', () => {
    const stored = broken(storedResultFixture);
    stored.attributes.Decoding.items = stored.attributes.Decoding.items_seen;
    delete stored.attributes.Decoding.items_seen;
    expect(storedResultSchema.safeParse(stored).success).toBe(false);
  });
});

describe('overall transform — one field, two kinds (data contract §2.1)', () => {
  const linear = { kind: 'linear', a: 50, b: 12 } as const;
  const tcc = { kind: 'tcc' } as const;
  const withTransform = (transform: unknown) => {
    const body = broken(scoreReqFixture);
    body.reference_sets.overall_pool.transform = transform;
    return scoreRequestSchema.safeParse(body);
  };

  it('accepts the linear arm with a and b', () => {
    expect(withTransform(linear).success).toBe(true);
  });

  it('accepts the tcc arm with neither', () => {
    expect(withTransform(tcc).success).toBe(true);
  });

  it('rejects a tcc transform carrying a or b — a half-migrated pool, not a detail', () => {
    expect(withTransform({ kind: 'tcc', a: 50, b: 12 }).success).toBe(false);
    expect(withTransform({ kind: 'tcc', a: 50 }).success).toBe(false);
    expect(withTransform({ kind: 'tcc', b: 12 }).success).toBe(false);
  });

  it('rejects a linear transform missing a or b', () => {
    expect(withTransform({ kind: 'linear', a: 50 }).success).toBe(false);
    expect(withTransform({ kind: 'linear', b: 12 }).success).toBe(false);
    expect(withTransform({ kind: 'linear' }).success).toBe(false);
  });

  it('rejects an unknown kind rather than falling back to linear', () => {
    expect(withTransform({ kind: 'logistic', a: 50, b: 12 }).success).toBe(false);
    expect(withTransform({ a: 50, b: 12 }).success).toBe(false);
  });
});
