import { describe, expect, test } from 'vitest';

import type { AssessedBand, ResultView } from '@schooltest/scoring-contracts';

import { buildStudentDrillDownView } from '@/modules/teacher/lib/student-drill-down-view';
import { t2ResultAmara } from '@/modules/teacher/lib/v2/__fixtures__/t2';

const DISPLAY_ORDER = [
  'Decoding',
  'Vocab_A2',
  'Grammar',
  'Vocab_B1',
  'Gist',
  'Detail',
  'Inference',
  'Vocab_B2',
  'Critical',
] as const;

function withGate(base: ResultView, passed: boolean | null): ResultView {
  return { ...base, gate: { ...base.gate, passed } };
}

function withAcademicBand(base: ResultView, band: AssessedBand | null): ResultView {
  return { ...base, academic_vocab: { ...base.academic_vocab, band, provisional_cut: true } };
}

describe('buildStudentDrillDownView — the nine-row breakdown (Spec 02 §3c)', () => {
  test('the nine rows keep the canonical display order', () => {
    const view = buildStudentDrillDownView(t2ResultAmara);
    expect(view.breakdown.map((row) => row.attribute)).toEqual([...DISPLAY_ORDER]);
    expect(view.breakdown.filter((row) => row.kind === 'band')).toHaveLength(8);
    expect(view.breakdown.at(-1)).toEqual({ kind: 'gate', attribute: 'Critical', passed: false });
  });

  test('rows 1-8 carry the server band; a not-assessed skill is a null band', () => {
    const rows = buildStudentDrillDownView(t2ResultAmara).breakdown;
    expect(rows[0]).toEqual({
      kind: 'band',
      attribute: 'Decoding',
      band: null,
      provisionalCut: false,
    });
    expect(rows[1]).toEqual({
      kind: 'band',
      attribute: 'Vocab_A2',
      band: null,
      provisionalCut: false,
    });
    expect(rows[2]).toEqual({
      kind: 'band',
      attribute: 'Grammar',
      band: null,
      provisionalCut: false,
    });
    expect(rows[3]).toEqual({
      kind: 'band',
      attribute: 'Vocab_B1',
      band: 'not_yet',
      provisionalCut: false,
    });
    expect(rows[4]).toEqual({
      kind: 'band',
      attribute: 'Gist',
      band: 'not_yet',
      provisionalCut: false,
    });
    expect(rows[5]).toEqual({
      kind: 'band',
      attribute: 'Detail',
      band: 'not_yet',
      provisionalCut: false,
    });
    expect(rows[6]).toEqual({
      kind: 'band',
      attribute: 'Inference',
      band: 'not_yet',
      provisionalCut: false,
    });
  });

  test('Academic vocabulary is a band row carrying the provisional cut', () => {
    const nullBand = buildStudentDrillDownView(t2ResultAmara).breakdown[7];
    expect(nullBand).toEqual({
      kind: 'band',
      attribute: 'Vocab_B2',
      band: null,
      provisionalCut: true,
    });

    const banded = buildStudentDrillDownView(withAcademicBand(t2ResultAmara, 'developing'))
      .breakdown[7];
    expect(banded).toEqual({
      kind: 'band',
      attribute: 'Vocab_B2',
      band: 'developing',
      provisionalCut: true,
    });
  });

  test('Critical reading is the exit gate for passed true, false and null', () => {
    for (const passed of [true, false, null] as const) {
      const rows = buildStudentDrillDownView(withGate(t2ResultAmara, passed)).breakdown;
      expect(rows.at(-1)).toEqual({ kind: 'gate', attribute: 'Critical', passed });
    }
  });

  test('the seven CDM rows, the gate and the recency-ordered tests stay intact', () => {
    const view = buildStudentDrillDownView(t2ResultAmara);
    expect(view.skills.map((skill) => skill.attribute)).toEqual([
      'Decoding',
      'Vocab_A2',
      'Grammar',
      'Vocab_B1',
      'Gist',
      'Detail',
      'Inference',
    ]);
    expect(view.gate).toEqual({ score: 47, passed: false });
    expect(view.tests).toHaveLength(8);
  });
});
