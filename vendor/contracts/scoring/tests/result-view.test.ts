/**
 * The read-model and export rules that the honesty guardrails (data contract §8,
 * spec v2 §6-§7) depend on, asserted on the contract itself so no consumer has
 * to be trusted to re-derive them.
 */
import { describe, expect, it } from 'vitest';

import {
  RESULT_HISTORY_MAX_POINTS,
  deltaDisplaySchema,
  diagnosticExportSchema,
  displaySkillSchema,
  resultHistoryPointSchema,
  resultViewSchema,
  resultViewVocabSchema,
} from '../src/index';

import diagnosticExportFixture from '../fixtures/diagnostic-export.json';
import resultViewFixture from '../fixtures/result-view.json';

function broken<T>(fixture: T): any {
  return JSON.parse(JSON.stringify(fixture));
}

describe('ResultView v2', () => {
  it('omits history rather than emptying it, and caps it at eight sittings', () => {
    const roster = broken(resultViewFixture);
    delete roster.history;
    expect(resultViewSchema.safeParse(roster).success).toBe(true);

    const tooLong = broken(resultViewFixture);
    const point = tooLong.history[0];
    tooLong.history = Array.from({ length: RESULT_HISTORY_MAX_POINTS + 1 }, () => point);
    expect(resultViewSchema.safeParse(tooLong).success).toBe(false);
  });

  it('CARRIES display_label, supplementary and productive_scores — v2 does not replace them', () => {
    // THIS TEST USED TO ASSERT THE OPPOSITE, and the premise was wrong rather
    // than the assertion. These three are not v1 fields "the view replaces":
    // they are load-bearing on live consumers. The app parses this endpoint
    // with a `z.strictObject`, so a MISSING key is a parse error even for a
    // field nothing renders — and the web teacher report renders
    // `supplementary` through `buildSupplementaryStrand`. Dropping them broke
    // three app surfaces before anyone noticed, because every guard in the
    // stack was asking whether they rendered instead of whether they existed.
    const withLabel = broken(resultViewFixture);
    withLabel.display_label = 'Developing Reader';
    expect(resultViewSchema.safeParse(withLabel).success).toBe(true);

    // A null label is meaningful, not missing: the app reads it as "no label
    // yet, retry".
    const nullLabel = broken(resultViewFixture);
    nullLabel.display_label = null;
    expect(resultViewSchema.safeParse(nullLabel).success).toBe(true);

    const nullProductive = broken(resultViewFixture);
    nullProductive.productive_scores = null;
    expect(resultViewSchema.safeParse(nullProductive).success).toBe(true);
  });

  it('still refuses a MALFORMED supplementary — carrying the field is not trusting it', () => {
    // Missing the required B1 strand. Only `vocab_band_b2_accuracy` defaults.
    const partial = broken(resultViewFixture);
    partial.supplementary = { vocab_band_a2_accuracy: 0.86 };
    expect(resultViewSchema.safeParse(partial).success).toBe(false);

    // Out of range: an accuracy is a proportion.
    const outOfRange = broken(resultViewFixture);
    outOfRange.supplementary = { vocab_band_a2_accuracy: 7.3, vocab_band_b1_accuracy: 0.5 };
    expect(resultViewSchema.safeParse(outOfRange).success).toBe(false);
  });

  it('rejects the v1 fields that ARE genuinely v1 concepts', () => {
    // `combined_children` is the recursive placement parent/child shape, and
    // combined rows do not enter v2 at all — v2 is a single-sitting reading
    // read model, so a parent-of-children shape has no meaning here.
    const combined = broken(resultViewFixture);
    combined.combined_children = [];
    expect(resultViewSchema.safeParse(combined).success).toBe(false);

    // `legacy_caveat` belongs to the legacy-r7 population, which v1 serves.
    const legacy = broken(resultViewFixture);
    legacy.legacy_caveat = 'pilot_diagnostic_earlier_model';
    expect(resultViewSchema.safeParse(legacy).success).toBe(false);
  });

  it('keeps `provisional` as the field_test banner, separate from the transform flag', () => {
    const fieldTest = broken(resultViewFixture);
    fieldTest.provisional = 'field_test';
    expect(resultViewSchema.safeParse(fieldTest).success).toBe(true);

    const wrong = broken(resultViewFixture);
    wrong.provisional = true;
    expect(resultViewSchema.safeParse(wrong).success).toBe(false);

    // The transform flag lives here and nowhere else.
    expect(resultViewFixture.overall.provisional_transform).toBe(true);
  });

  it('rejects items_answered above items_total', () => {
    const view = broken(resultViewFixture);
    view.items_answered = view.items_total + 1;
    expect(resultViewSchema.safeParse(view).success).toBe(false);
  });

  it('renders a delta as steady, band_movement or a signed integer — nothing else', () => {
    for (const value of ['steady', 'band_movement', '+15', '-10']) {
      expect(deltaDisplaySchema.safeParse(value).success).toBe(true);
    }
    for (const value of ['15', 'improved', '+1.5', '']) {
      expect(deltaDisplaySchema.safeParse(value).success).toBe(false);
    }
  });

  it('keys history by all seven display skills, null where not assessed', () => {
    const point = broken(resultViewFixture.history[1]);
    expect(resultHistoryPointSchema.safeParse(point).success).toBe(true);
    expect(Object.keys(point.attributes).sort()).toEqual([...displaySkillSchema.options].sort());

    // A sitting that simply drops an unassessed skill is not acceptable: the
    // absence has to be stated (data contract §8 — never a silent gap).
    delete point.attributes.Gist;
    expect(resultHistoryPointSchema.safeParse(point).success).toBe(false);
  });

  it('requires an opaque student_document_id (R5/D19) — the join key the roster read exists for', () => {
    expect(typeof resultViewFixture.student_document_id).toBe('string');
    expect(resultViewFixture.student_document_id.length).toBeGreaterThan(0);

    // Without it a roster row cannot be keyed to a student at all, so the
    // field is REQUIRED, not nullable: a view that cannot be joined is not
    // a valid view. It is an id, never a name — the no-PII rule itself is
    // enforced by the export schema, which admits no name-shaped field.
    const anonymous = broken(resultViewFixture);
    delete anonymous.student_document_id;
    expect(resultViewSchema.safeParse(anonymous).success).toBe(false);
  });

  it('enforces the vocab gap invariant as a biconditional (D20), in both directions', () => {
    const vocabulary = broken(resultViewFixture.vocab);

    // Neither strand assessed: no number AND no band — together.
    const gap = { ...vocabulary, blended: null, status: 'not_assessed' };
    expect(resultViewVocabSchema.safeParse(gap).success).toBe(true);

    // A blend with no band to name it: rejected.
    const numberNoBand = { ...vocabulary, status: 'not_assessed' };
    expect(resultViewVocabSchema.safeParse(numberNoBand).success).toBe(false);

    // A band on an empty blend — the untranslateable chip on a gap card: rejected.
    const bandNoNumber = { ...vocabulary, blended: null };
    expect(resultViewVocabSchema.safeParse(bandNoNumber).success).toBe(false);
  });
});

describe('diagnostic export v2', () => {
  it('carries no posterior and no theta, at any depth', () => {
    const serialised = JSON.stringify(
      diagnosticExportSchema.parse(diagnosticExportFixture)
    );
    expect(serialised).not.toMatch(/"prob"|"prob_se"|"theta"|"theta_se"/);
  });

  it('rejects a bundle that reintroduces prob or theta', () => {
    const withProb = broken(diagnosticExportFixture);
    withProb.skills.Decoding.prob = 0.98;
    expect(diagnosticExportSchema.safeParse(withProb).success).toBe(false);

    const withTheta = broken(diagnosticExportFixture);
    withTheta.overall.theta = 1.24;
    expect(diagnosticExportSchema.safeParse(withTheta).success).toBe(false);
  });

  it('rejects a student name and an empty caveat block', () => {
    const named = broken(diagnosticExportFixture);
    named.student.name = 'A Student';
    expect(diagnosticExportSchema.safeParse(named).success).toBe(false);

    const uncaveated = broken(diagnosticExportFixture);
    uncaveated.caveats = [];
    expect(diagnosticExportSchema.safeParse(uncaveated).success).toBe(false);
  });

  it('states every one of the seven display skills', () => {
    const missing = broken(diagnosticExportFixture);
    delete missing.skills.Critical;
    expect(diagnosticExportSchema.safeParse(missing).success).toBe(false);
  });
});
