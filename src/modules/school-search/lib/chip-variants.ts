import { cva, type VariantProps } from 'class-variance-authority';

// Filter-chip pill (spec §13.1): active = solid primary; idle = white with input border,
// muted-foreground text, muted hover. Motion baseline: colour transition + press feedback,
// disabled under prefers-reduced-motion.
export const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 ease-out select-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
  {
    variants: {
      active: {
        true: 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90',
        false:
          'border border-input bg-background font-medium text-muted-foreground hover:bg-muted',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type ChipVariantProps = VariantProps<typeof chipVariants>;
