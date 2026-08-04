import type { SegmentedControlSize } from '@/modules/design-system/types/design-system.types';

export const TRACK: Record<SegmentedControlSize, string> = {
  md: 'rounded-segment p-1',
  sm: 'rounded-lg p-1',
};

export const ITEM: Record<SegmentedControlSize, string> = {
  md: 'min-h-8.5 rounded-md px-4 py-1.75 text-caption after:-inset-y-1.5',
  sm: 'min-h-8 rounded-sm px-3.25 py-1.5 text-meta after:-inset-y-1.5',
};
