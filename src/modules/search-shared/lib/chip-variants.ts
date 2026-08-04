import { cva } from 'class-variance-authority';

import { SEARCH_CHIP_BASE } from '@/modules/search-shared/constants/chip.constants';

// The ONE toolbar chip for every search pane. Idle is the canonical ChoicePill ink
// (#475569 on #FFFFFF, 1px #CBD5E1); active is the canonical blue-50 selected pill.
export const chipVariants = cva(SEARCH_CHIP_BASE, {
  variants: {
    active: {
      true: 'border-primary bg-blue-50 font-semibold text-primary',
      false: 'border-input bg-card font-medium text-body hover:bg-background',
    },
  },
  defaultVariants: {
    active: false,
  },
});

// The two tones the design's filter bar draws beside the quiet chip:
//   solid   — the navy "All filters" / "Show N" button (#0E2350, white 13/600,
//             hover #16326E)
//   outline — an APPLIED filter chip (white, 1px #0E2350, navy 13/500)
export const searchChipVariants = cva(SEARCH_CHIP_BASE, {
  variants: {
    tone: {
      solid:
        'border-navy-900 bg-navy-900 font-semibold text-primary-foreground shadow-sm hover:border-navy-800 hover:bg-navy-800',
      outline: 'border-navy-900 bg-card font-medium text-foreground hover:bg-background',
    },
  },
  defaultVariants: {
    tone: 'outline',
  },
});
