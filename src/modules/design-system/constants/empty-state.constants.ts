import type { EmptyStateTone } from '@/modules/design-system/types/design-system.types';

// `brand` is the canonical in-panel variant (52px rounded-square medallion on
// soft blue); `muted` keeps the neutral tile the error surfaces already use.
export const MEDALLION_TONES: Record<EmptyStateTone, string> = {
  brand: 'size-13 rounded-panel bg-blue-50 text-primary',
  muted: 'size-10 rounded-lg bg-muted text-muted-foreground',
};
