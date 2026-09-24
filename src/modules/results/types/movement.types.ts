import type { DisplaySkill } from '@schooltest/scoring-contracts';

export interface MovementRow {
  skill: DisplaySkill;
  deltaDisplay: string | null;
  /** One slot per history point; null where that sitting did not assess the skill. */
  points: Array<number | null>;
}

export interface RowWithSort extends MovementRow {
  group: 0 | 1 | 2;
  value: number; // gains: the delta (desc); declines: the delta (asc); rest: canonical order
  order: number;
}

export type Growth = { reliable: boolean | null; value: number | null; display: string | null } | null;
