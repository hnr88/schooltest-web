import type { AssessedBand, DisplaySkill } from '@schooltest/scoring-contracts';

import type { PairingsView, TeachingGroup } from '@/modules/teacher/types/v2-insights.types';
import type { AcaraPhaseName, PhaseView, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

export type TeachingStrand = 'vocabulary' | 'comprehension' | 'foundations';
export type TeachingSkill = Exclude<DisplaySkill, 'Critical'>;
export type NextPhase = AcaraPhaseName | 'Extend';

export interface TeachingStudent {
  studentDocumentId: string;
  name: string;
  firstName: string;
  initials: string;
}

export interface TeachingStrandGroup extends TeachingGroup {
  strand: TeachingStrand;
  skill: TeachingSkill;
  band: AssessedBand | null;
  phase: PhaseView | null;
  provisionalCut: boolean;
  students: TeachingStudent[];
}

export interface TeachingTarget {
  skill: TeachingSkill;
  labelKey: string;
  band: AssessedBand;
  phase: AcaraPhaseName;
  nextPhase: NextPhase;
  tone: ViewTone;
  provisionalCut: boolean;
}

export interface TeachingNextStep extends TeachingStudent {
  vocabulary: TeachingTarget | null;
  comprehension: TeachingTarget | null;
}

export interface TeachingGateSummary {
  passed: number;
  notYet: number;
  provisionalCut: boolean;
}

export interface TeachingPlanView {
  strands: Record<TeachingStrand, TeachingStrandGroup[]>;
  pairings: PairingsView;
  nextSteps: TeachingNextStep[];
  gate: TeachingGateSummary;
  counts: {
    vocabularyGroups: number;
    comprehensionGroups: number;
    foundationsGroups: number;
    pairs: number;
    students: number;
  };
}

export interface TeachingPlanState {
  view: TeachingPlanView;
  hasResults: boolean;
}
