import type { AssessedBand, DisplaySkill } from '@schooltest/scoring-contracts';

export type AcaraPhaseName = 'Beginning' | 'Emerging' | 'Developing' | 'Consolidating';

export type PhaseSource = 'server' | 'score';

export interface ViewTone {
  fg: string;
  bg: string;
}

export interface PhaseView {
  phase: AcaraPhaseName;
  source: PhaseSource;
  labelKey: string;
  subLabelKey: string;
  tone: ViewTone;
}

export type GrowthKind = 'up' | 'down' | 'flat' | 'steady' | 'none';

export interface GrowthSource {
  delta: number | null;
  delta_reliable: boolean | null;
  delta_display: string | null;
}

export interface GrowthView {
  kind: GrowthKind;
  delta: number | null;
  points: number | null;
  reliable: boolean | null;
  fg: string;
}

export interface SkillRef {
  skill: DisplaySkill;
  labelKey: string;
}

export interface ScoredSkill extends SkillRef {
  score: number;
}

export interface BandView {
  band: AssessedBand;
  labelKey: string;
  tone: ViewTone;
}

export interface SeriesPoint {
  n: number;
  satAt: string | null;
  value: number;
}

export interface ClassSeriesPoint extends SeriesPoint {
  contributors: number;
}

export interface ScoreSpan {
  from: number;
  to: number;
  difference: number;
}
