import { describe, expect, test } from 'vitest';

import { displaySkills } from '@/modules/results';
import { TEACHING_STRANDS } from '@/modules/teacher/constants/teaching.constants';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { rosterGroups, strandGroups } from '@/modules/teacher/lib/v2/roster-groups';

describe('rosterGroups — recorded t2 roster', () => {
  test('each student under their weakest subskill in display order; no scored subskill → Not yet assessed, last', () => {
    expect(rosterGroups(t2Roster).map((group) => [group.attribute, group.labelKey, group.count, group.members])).toEqual([
      [
        'Decoding',
        'skill.decoding',
        10,
        [
          'Jae-won Baptiste',
          'Oluwaseun Baptiste',
          'Mihail Baptiste',
          'Gia Baptiste',
          'Hamza Baptiste',
          'Dilnoza Baptiste',
          'Eitan Baptiste',
          'Kaveh Baptiste',
          'Ines Baptiste',
          'Farida Baptiste',
        ],
      ],
      // Everyday and Classroom Vocabulary are separate groups: Tenzin's gap is everyday, Amara's classroom.
      ['Vocab_A2', 'attribute.vocabA2', 1, ['Tenzin Baptiste']],
      ['Vocab_B1', 'attribute.vocabB1', 1, ['Amara Baptiste']],
      [
        'not_yet_assessed',
        'attribute.notYetAssessed',
        8,
        [
          'Lucia Baptiste',
          'Bilal Baptiste',
          'Panit Baptiste',
          'Qadir Baptiste',
          'Sunniva Baptiste',
          'Chen Baptiste',
          'Nour Baptiste',
          'Rosa Baptiste',
        ],
      ],
    ]);
  });

  test('every roster student lands in exactly one group', () => {
    const members = rosterGroups(t2Roster).flatMap((group) => group.members);
    expect(members.toSorted()).toEqual(t2Roster.map((row) => row.student.name).toSorted());
  });

  test('an empty roster (every recorded row removed) has no groups', () => {
    expect(rosterGroups(t2Roster.slice(0, 0))).toEqual([]);
  });

  test('each assessed student appears exactly once in each applicable Teaching strand', () => {
    for (const strand of ['vocabulary', 'comprehension', 'foundations'] as const) {
      const skills: readonly string[] = TEACHING_STRANDS[strand];
      const expected = t2Roster.filter((row) => row.result !== null && displaySkills(row.result)
        .some((tile) => skills.includes(tile.skill) && tile.domain_score !== null));
      const groups = strandGroups(t2Roster, strand);
      expect(groups.flatMap((group) => group.students.map((student) => student.studentDocumentId)).sort())
        .toEqual(expected.map((row) => row.student.document_id).sort());
      expect(groups.map((group) => group.skill)).not.toContain('Critical');
    }
  });
});
