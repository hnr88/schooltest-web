import type { ClassDiagnostic } from '@/modules/teach';
import type { AcaraPhaseName, SkillRef, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

export type TeachingDiagnostic = Pick<ClassDiagnostic, 'form_code' | 'groups'>;

export interface LastSittingKpi {
  satAt: string | null;
  formCode: string | null;
}

export interface UpSinceLastKpi {
  value: number | null;
  paired: number;
  fg: string;
}

export interface ParticipationKpi {
  percent: number | null;
  scored: number;
  total: number;
}

export interface InsightsKpis {
  lastSitting: LastSittingKpi;
  classAverage: number | null;
  upSinceLast: UpSinceLastKpi;
  topGap: SkillRef | null;
  participation: ParticipationKpi;
}

export type MasteryFlagKind = 'focus' | 'strength';

export interface MasteryFlag {
  kind: MasteryFlagKind;
  labelKey: string;
  tone: ViewTone;
}

export interface MasteryRow extends SkillRef {
  mean: number | null;
  assessed: number;
  secure: number | null;
  gatePassed: number | null;
  tone: ViewTone;
  flag: MasteryFlag | null;
}

export interface PhaseBar {
  phase: AcaraPhaseName;
  labelKey: string;
  count: number;
  width: number;
  fg: string;
}

export interface CohortGrowth {
  improved: number;
  held: number;
  slipped: number;
  paired: number;
}

export interface CohortVocab {
  a2: number | null;
  a2Assessed: number;
  b1: number | null;
  b1Assessed: number;
}

export interface CohortView {
  phases: PhaseBar[];
  phased: number;
  growth: CohortGrowth;
  vocab: CohortVocab;
}

export interface PairingStudent {
  studentDocumentId: string;
  firstName: string;
  score: number;
}

export interface Pairing {
  strong: PairingStudent;
  support: PairingStudent;
}

export interface PairingsView {
  skill: SkillRef | null;
  pairs: Pairing[];
}

export interface TeachingGroup {
  attribute: string;
  labelKey: string | null;
  count: number;
  members: string[];
}

export interface TeachingInsightsView {
  kpis: InsightsKpis;
  mastery: MasteryRow[];
  cohort: CohortView;
  pairings: PairingsView;
  groups: TeachingGroup[];
}
