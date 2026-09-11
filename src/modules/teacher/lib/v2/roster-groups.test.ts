import { describe, expect, test } from 'vitest';

import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { rosterGroups } from '@/modules/teacher/lib/v2/roster-groups';

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
      ['Vocabulary', 'skill.vocabulary', 2, ['Amara Baptiste', 'Tenzin Baptiste']],
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
});
