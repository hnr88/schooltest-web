import { cva, type VariantProps } from 'class-variance-authority';

// Geometry of every pill in the search filter bar, read from the design
// (.qa/design/spec/01 §8.2): 13px type, 9px 16px padding, radius 999. The DRAWN pill
// stays at that size; the 44px pointer target comes from the ::after expansion, the
// idiom ChoicePillGroup and IconButton already use.
const SEARCH_CHIP_BASE =
  'relative inline-flex items-center gap-1.75 rounded-full border px-4 py-2.25 text-caption transition-[background-color,border-color,color,transform] duration-200 ease-out-expo select-none after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

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

export type ChipVariantProps = VariantProps<typeof chipVariants>;
export type SearchChipVariantProps = VariantProps<typeof searchChipVariants>;
