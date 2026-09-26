import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import { getStudentFirstName } from '@/lib/student-name';
import { displaySkills, resultViewsOf, subskillAverages, type RosterRow } from '@/modules/results';
import { TEACHING_STRANDS } from '@/modules/teacher/constants/teaching.constants';
import type { TeachingSkill, TeachingStrand, TeachingStudent } from '@/modules/teacher/types/teaching-plan.types';

export function classSkillMeans(roster: readonly RosterRow[]): ReadonlyMap<DisplaySkill, number> {
  return new Map(subskillAverages(resultViewsOf(roster)).map((entry) => [entry.skill, entry.average]));
}

export function limitingSkill(
  result: ResultView,
  strand: TeachingStrand,
  means: ReadonlyMap<DisplaySkill, number>,
): TeachingSkill | null {
  const scores = new Map(displaySkills(result).map((tile) => [tile.skill, tile.domain_score]));
  let selected: TeachingSkill | null = null;
  let smallestGap = Infinity;
  for (const skill of TEACHING_STRANDS[strand]) {
    const score = scores.get(skill);
    const mean = means.get(skill);
    if (score === null || score === undefined || mean === undefined) continue;
    const gap = score - mean;
    if (gap < smallestGap) {
      selected = skill;
      smallestGap = gap;
    }
  }
  return selected;
}

export function largestGapSkill(means: ReadonlyMap<DisplaySkill, number>): TeachingSkill | null {
  let selected: TeachingSkill | null = null;
  let lowestMean = Infinity;
  for (const [skill, mean] of means) {
    if (skill === 'Critical' || mean >= lowestMean) continue;
    selected = skill;
    lowestMean = mean;
  }
  return selected;
}

export function teachingStudent(row: RosterRow): TeachingStudent {
  return {
    studentDocumentId: row.student.document_id,
    name: row.student.name,
    firstName: getStudentFirstName(row.student.name),
    initials: row.student.initials,
  };
}
