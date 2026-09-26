import { describe, expect, test } from 'vitest';

import { strandGroups } from '@/modules/teacher/lib/v2/roster-groups';
import { teachingRow } from '@/modules/teacher/lib/v2/teaching/test-roster';

describe('strand groups', () => {
  test('uses relative gaps, with each student in exactly one group in strand order', () => {
    const rows = [
      teachingRow('Ada Private', { Vocab_A2: [20, 'secure'], Vocab_B1: [60, 'emerging'] }),
      teachingRow('Ben Private', { Vocab_A2: [20, 'developing'], Vocab_B1: [100, 'secure'] }),
    ];
    const groups = strandGroups(rows, 'vocabulary');
    expect(groups.map((group) => [group.skill, group.members])).toEqual([
      ['Vocab_A2', ['Ben Private']], ['Vocab_B1', ['Ada Private']],
    ]);
    expect(groups.map((group) => group.band)).toEqual(['developing', 'emerging']);
    expect(groups.flatMap((group) => group.students.map((student) => student.studentDocumentId)).sort())
      .toEqual(['Ada Private', 'Ben Private']);
  });

  test('representative phase is modal server band; tied frequencies choose lower', () => {
    const rows = [
      teachingRow('A', { Gist: [99, 'not_yet'] }),
      teachingRow('B', { Gist: [1, 'secure'] }),
      teachingRow('C', { Gist: [1, 'secure'] }),
    ];
    expect(strandGroups(rows, 'comprehension')[0]).toMatchObject({ band: 'secure', phase: { phase: 'Consolidating' } });
    expect(strandGroups(rows.slice(0, 2), 'comprehension')[0]).toMatchObject({ band: 'not_yet', phase: { phase: 'Beginning' } });
  });

  test('excludes Critical and missing strand scores, uses strand order for equal gaps', () => {
    const rows = [teachingRow('A', { Critical: [0, 'not_yet'], Gist: [80, 'secure'], Detail: [1, 'not_yet'] })];
    expect(strandGroups(rows, 'comprehension').map((group) => group.skill)).toEqual(['Gist']);
    expect(strandGroups(rows, 'vocabulary')).toEqual([]);
    expect(strandGroups([{ ...rows[0], result: null }], 'comprehension')).toEqual([]);
  });

  test('Academic groups carry the provisional flag; unmeasured academic scores stay absent', () => {
    const row = teachingRow('A', { Vocab_B2: [20, 'emerging'] });
    expect(strandGroups([row], 'vocabulary')[0]).toMatchObject({ skill: 'Vocab_B2', provisionalCut: true });
    if (row.result) row.result.academic_vocab.band = null;
    expect(strandGroups([row], 'vocabulary')).toEqual([]);
  });

  test('Foundations covers Decoding and Grammar in order, including above-average students', () => {
    const rows = [
      teachingRow('A', { Decoding: [10, 'not_yet'], Grammar: [90, 'developing'] }),
      teachingRow('B', { Decoding: [30, 'emerging'], Grammar: [50, 'secure'] }),
      teachingRow('C', { Decoding: [100, 'secure'], Grammar: [100, 'secure'] }),
    ];
    const groups = strandGroups(rows, 'foundations');
    expect(groups.map((group) => [group.skill, group.members])).toEqual([
      ['Decoding', ['A']], ['Grammar', ['B', 'C']],
    ]);
  });
});
