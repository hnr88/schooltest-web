import { TEACHING_PROMPT_SKILL } from '@/modules/teacher/constants/teaching.constants';
import type {
  TeachingNextStep,
  TeachingStrand,
  TeachingStrandGroup,
  TeachingTarget,
} from '@/modules/teacher/types/teaching-plan.types';

export function groupPrompt(group: TeachingStrandGroup): string {
  const phase = group.phase?.phase;
  const caveat = group.provisionalCut ? ' (provisional)' : '';
  const focus = TEACHING_PROMPT_SKILL[group.skill];
  if (phase === undefined) return `## ${focus}\n\nPhase not yet assessed.\n`;
  return `## ${focus}\n\nSuggest a short activity to move this group from ${phase}${caveat} toward the next phase in ${focus}.\n`;
}

const STRAND_PROMPT_TITLE: Readonly<Record<TeachingStrand, string>> = {
  vocabulary: 'Vocabulary (word level)',
  comprehension: 'Comprehension (paragraph level)',
  foundations: 'Foundations (decoding and grammar)',
};

export function strandPrompt(strand: TeachingStrand, groups: readonly TeachingStrandGroup[]): string {
  return `# ${STRAND_PROMPT_TITLE[strand]}\n\n${groups.filter((group) => group.strand === strand).map(groupPrompt).join('\n')}`;
}

function targetPrompt(target: TeachingTarget | null): string[] {
  if (target === null) return [];
  const caveat = target.provisionalCut ? ' (provisional)' : '';
  const focus = TEACHING_PROMPT_SKILL[target.skill];
  if (target.nextPhase === 'Extend') {
    return [`- ${focus}: Suggest a short activity to extend a student already at ${target.phase}${caveat} in ${focus}.`];
  }
  return [`- ${focus}: Suggest a short activity to move a student from ${target.phase}${caveat} toward the next phase (${target.nextPhase}) in ${focus}.`];
}

export function studentPrompt(student: TeachingNextStep): string {
  return `## Student ${student.initials}\n\n${[...targetPrompt(student.vocabulary), ...targetPrompt(student.comprehension)].join('\n')}\n`;
}

export function allStudentsPrompt(students: readonly TeachingNextStep[]): string {
  return `# Student next steps\n\n${students.map(studentPrompt).join('\n')}`;
}
