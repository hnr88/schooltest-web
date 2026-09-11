import type { RosterReleaseState } from '@/modules/results';
import type { KpiCardTone, ToneChipTone } from '@/modules/teacher/types/teacher-kit.types';
import type { ExpectedKind, FamilyCounts, FamilyFilter } from '@/modules/teacher/types/v2-family.types';

export const FAMILY_FILTERS: readonly FamilyFilter[] = ['all', 'held', 'released', 'blocked'];

export const RELEASE_CHIP_TONE: Readonly<Record<RosterReleaseState, ToneChipTone>> = {
  held: 'today',
  released: 'success',
  recalled: 'danger',
  manual: 'danger',
  absent: 'slate',
  nosit: 'slate',
  open: 'navy',
};

export const EXPECTED_CHIP_TONE: Readonly<Record<ExpectedKind, ToneChipTone>> = {
  at: 'navy',
  approaching: 'warning',
  below: 'danger',
};

export const FAMILY_TILES = [
  { key: 'scored', tone: 'navy' },
  { key: 'released', tone: 'success' },
  { key: 'held', tone: 'warning' },
  { key: 'noResult', tone: 'danger' },
] as const satisfies readonly { key: keyof FamilyCounts; tone: KpiCardTone }[];

export const RECALL_REASON_MAX = 500;
