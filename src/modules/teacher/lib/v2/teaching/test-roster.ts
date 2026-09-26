import type { AssessedBand, DisplaySkill } from '@schooltest/scoring-contracts';

import type { RosterRow } from '@/modules/results';
import { t2Result, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';

export function teachingRow(
  name: string,
  skills: Partial<Record<DisplaySkill, readonly [number, AssessedBand]>>,
): RosterRow {
  const result = structuredClone(t2Result('Dilnoza'));
  result.attributes = {};
  result.academic_vocab = { domain_score: null, band: null, se: null, items_seen: 0, provisional_cut: true };
  result.gate = { domain_score: null, passed: null, provisional_cut: false };
  const attribute = t2Result('Dilnoza').attributes.Decoding;
  if (attribute?.status === 'not_assessed' || attribute === undefined) throw new Error('Scored fixture required');
  for (const [skill, [score, band]] of Object.entries(skills)) {
    if (skill === 'Vocab_B2') result.academic_vocab = { ...result.academic_vocab, domain_score: score, band };
    else if (skill === 'Critical') result.gate.domain_score = score;
    else result.attributes[skill as keyof typeof result.attributes] = { ...attribute, domain_score: score, status: band };
  }
  return { ...t2Row('Dilnoza'), student: { document_id: name, name, initials: name[0], eald_flag: false }, result };
}
