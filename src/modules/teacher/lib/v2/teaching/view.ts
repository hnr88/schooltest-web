import type { RosterRow } from '@/modules/results';
import { peerPairings } from '@/modules/teacher/lib/v2/pairings';
import { strandGroups } from '@/modules/teacher/lib/v2/teaching/groups';
import { teachingNextSteps } from '@/modules/teacher/lib/v2/teaching/next-steps';
import { classSkillMeans, largestGapSkill } from '@/modules/teacher/lib/v2/teaching/skills';
import type { TeachingGateSummary, TeachingPlanView } from '@/modules/teacher/types/teaching-plan.types';

export function teachingGateSummary(roster: readonly RosterRow[]): TeachingGateSummary {
  const summary: TeachingGateSummary = { passed: 0, notYet: 0, provisionalCut: false };
  for (const { result } of roster) {
    if (result?.gate.passed === true) summary.passed += 1;
    else if (result?.gate.passed === false) summary.notYet += 1;
    if (result?.gate.passed !== null && result?.gate.provisional_cut === true) summary.provisionalCut = true;
  }
  return summary;
}

export function teachingPlan(roster: readonly RosterRow[]): TeachingPlanView {
  const means = classSkillMeans(roster);
  const strands = {
    vocabulary: strandGroups(roster, 'vocabulary', means),
    comprehension: strandGroups(roster, 'comprehension', means),
    foundations: strandGroups(roster, 'foundations', means),
  };
  const pairings = peerPairings(roster, largestGapSkill(means));
  const nextSteps = teachingNextSteps(roster, means);
  return {
    strands,
    pairings,
    nextSteps,
    gate: teachingGateSummary(roster),
    counts: {
      vocabularyGroups: strands.vocabulary.length,
      comprehensionGroups: strands.comprehension.length,
      foundationsGroups: strands.foundations.length,
      pairs: pairings.pairs.length,
      students: nextSteps.length,
    },
  };
}
