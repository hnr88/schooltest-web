import type { AssessedBand, DisplaySkill } from '@schooltest/scoring-contracts';

import type { RosterRow } from '@/modules/results';
import { TEACHING_STRANDS } from '@/modules/teacher/constants/teaching.constants';
import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { BAND_RANK, PHASE_ORDER } from '@/modules/teacher/constants/v2-thresholds.constants';
import { phaseView } from '@/modules/teacher/lib/v2/phase';
import { assessedBandOf } from '@/modules/teacher/lib/v2/skill-refs';
import { classSkillMeans, limitingSkill, teachingStudent } from '@/modules/teacher/lib/v2/teaching/skills';
import type { TeachingSkill, TeachingStrand, TeachingStrandGroup } from '@/modules/teacher/types/teaching-plan.types';

function modalBand(rows: readonly RosterRow[], skill: TeachingSkill): AssessedBand | null {
  const counts = new Map<AssessedBand, number>();
  for (const row of rows) {
    const band = row.result === null ? null : assessedBandOf(row.result, skill);
    if (band !== null) counts.set(band, (counts.get(band) ?? 0) + 1);
  }
  return [...counts].sort(([a, countA], [b, countB]) => countB - countA || BAND_RANK[a] - BAND_RANK[b])[0]?.[0] ?? null;
}

export function strandGroups(
  roster: readonly RosterRow[],
  strand: TeachingStrand,
  means: ReadonlyMap<DisplaySkill, number> = classSkillMeans(roster),
): TeachingStrandGroup[] {
  const bySkill = new Map<TeachingSkill, RosterRow[]>();
  for (const row of roster) {
    const skill = row.result === null ? null : limitingSkill(row.result, strand, means);
    if (skill !== null) bySkill.set(skill, [...(bySkill.get(skill) ?? []), row]);
  }
  return TEACHING_STRANDS[strand].flatMap((skill) => {
    const rows = bySkill.get(skill);
    if (rows === undefined) return [];
    const band = modalBand(rows, skill);
    return [{
      attribute: skill,
      skill,
      strand,
      labelKey: SKILL_LABEL_KEY[skill],
      count: rows.length,
      members: rows.map((row) => row.student.name),
      students: rows.map(teachingStudent),
      band,
      phase: band === null ? null : phaseView(PHASE_ORDER[BAND_RANK[band]], 'server'),
      provisionalCut: skill === 'Vocab_B2' && rows.some((row) => row.result?.academic_vocab.provisional_cut === true),
    }];
  });
}
