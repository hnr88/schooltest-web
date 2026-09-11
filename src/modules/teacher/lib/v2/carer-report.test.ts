import { describe, expect, test } from 'vitest';

import { t2Result, t2ResultAmara, t2ResultDilnoza, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { carerReport } from '@/modules/teacher/lib/v2/carer-report';

describe('carerReport — recorded results', () => {
  test('recorded Dilnoza (GET /results/:id) with her recorded roster student', () => {
    expect(carerReport(t2ResultDilnoza, t2Row('Dilnoza').student)).toEqual({
      studentDocumentId: t2Row('Dilnoza').student.document_id,
      resultDocumentId: 'gdijynxot3d31d0pt053jv37',
      name: 'Dilnoza Baptiste',
      firstName: 'Dilnoza',
      initials: 'DB',
      score: 41,
      expected: { kind: 'below', labelKey: 'expected.below', tone: { fg: '#B42318', bg: '#FDEEEC' } },
      phase: {
        phase: 'Beginning',
        source: 'server',
        labelKey: 'phase.beginning',
        subLabelKey: 'phaseSub.beginning',
        tone: { fg: '#B42318', bg: '#FDEEEC' },
      },
      status: { kind: 'held', labelKey: 'release.label.held', tone: { fg: '#92610B', bg: '#FDF3E0' } },
      satAt: '2026-09-10',
      summaryKey: 'carer.summary',
      canDo: [{ attribute: 'Inference', key: 'carer.can.inference' }],
      next: [
        { attribute: 'Vocab_B1', key: 'carer.next.vocabB1' },
        { attribute: 'Detail', key: 'carer.next.detail' },
      ],
      ealdNoteKey: null,
      actions: { release: true, recall: false },
    });
  });

  test('recorded Amara: nothing secure or developing, so no can-do line is invented', () => {
    const view = carerReport(t2ResultAmara, t2Row('Amara').student);
    expect(view.canDo).toEqual([]);
    expect(view.next).toEqual([
      { attribute: 'Inference', key: 'carer.next.inference' },
      { attribute: 'Detail', key: 'carer.next.detail' },
    ]);
    expect(view.expected).toBeNull();
    expect(view.phase).toMatchObject({ phase: 'Beginning', source: 'score' });
    expect(view.satAt).toBe('2026-09-11');
  });

  test('recorded Bilal: no attribute assessed, so neither list has a line', () => {
    const view = carerReport(t2Result('Bilal'), t2Row('Bilal').student);
    expect(view.canDo).toEqual([]);
    expect(view.next).toEqual([]);
    expect(view.score).toBe(54);
  });

  test('the EAL/D note appears only when the roster flags the student (recorded Dilnoza, flag set: derived)', () => {
    const flagged = { ...t2Row('Dilnoza').student, eald_flag: true };
    expect(carerReport(t2ResultDilnoza, flagged).ealdNoteKey).toBe('carer.ealdNote');
  });

  test('a released result can only be recalled (recorded Dilnoza, release_state released: derived)', () => {
    const view = carerReport({ ...t2ResultDilnoza, release_state: 'released' }, t2Row('Dilnoza').student);
    expect(view.status).toEqual({ kind: 'released', labelKey: 'release.label.released', tone: { fg: '#1F7A4D', bg: '#E9F6EF' } });
    expect(view.actions).toEqual({ release: false, recall: true });
  });

  test('a result in manual scoring offers neither action (recorded Dilnoza, release_state manual: derived)', () => {
    const view = carerReport({ ...t2ResultDilnoza, release_state: 'manual' }, t2Row('Dilnoza').student);
    expect(view.actions).toEqual({ release: false, recall: false });
  });
});
