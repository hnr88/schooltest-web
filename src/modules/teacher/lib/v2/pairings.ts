import type { DisplaySkill } from '@schooltest/scoring-contracts';

import { getStudentFirstName } from '@/lib/student-name';
import { displaySkills, type RosterRow } from '@/modules/results';

import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { PAIRING_MAX_PAIRS, PAIRING_MIN_GAP } from '@/modules/teacher/constants/v2-thresholds.constants';
import type { Pairing, PairingStudent, PairingsView } from '@/modules/teacher/types/v2-insights.types';

function scoredOn(roster: readonly RosterRow[], skill: DisplaySkill): PairingStudent[] {
  return roster.flatMap((row) => {
    if (row.result === null) return [];
    const score = displaySkills(row.result).find((tile) => tile.skill === skill)?.domain_score ?? null;
    if (score === null) return [];
    return [{ studentDocumentId: row.student.document_id, firstName: getStudentFirstName(row.student.name), score }];
  });
}

export function peerPairings(roster: readonly RosterRow[], skill: DisplaySkill | null): PairingsView {
  if (skill === null) return { skill: null, pairs: [] };
  const ranked = scoredOn(roster, skill).sort((a, b) => b.score - a.score);
  const pairs: Pairing[] = [];
  let support = ranked.length - 1;
  for (let strong = 0; strong < support && pairs.length < PAIRING_MAX_PAIRS; strong += 1) {
    if (ranked[strong].score - ranked[support].score >= PAIRING_MIN_GAP) {
      pairs.push({ strong: ranked[strong], support: ranked[support] });
    }
    support -= 1;
  }
  return { skill: { skill, labelKey: SKILL_LABEL_KEY[skill] }, pairs };
}
