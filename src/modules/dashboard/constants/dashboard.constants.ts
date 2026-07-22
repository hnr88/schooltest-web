export const RECENT_STUDENTS_LIMIT = 5;
export const FEATURED_STUDENTS_LIMIT = 4;
export const RECENTLY_ADDED_DAYS = 7;

// Entrance stagger for grids/rows — literal classes so Tailwind's scanner keeps them.
export const STAGGER_DELAYS = ['delay-0', 'delay-75', 'delay-150', 'delay-200'] as const;

// Transform-only entrance: a fade would leave elements at partial opacity while an
// axe pass runs and report every child as a contrast failure.
export const METRIC_ENTER =
  'animate-in fill-mode-backwards duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none';

// Recessed tile INSIDE a white panel (.qa/CONTRAST-SPEC.md → worstPairs #3, the
// second-worst measured boundary). The design-system default is bg-background
// (#F7F9FC) with no border — byte-identical to the page canvas two levels up, a
// 1.05:1 step marked by nothing. --color-surface-inset (#F1F5F9) plus the canonical
// #E3E8F0 hairline takes it to 1.10:1 with a real edge; canonical pairs light-on-light
// fills with a hairline three times on the landing. Applied as a className override
// so src/modules/design-system stays untouched.
//
// The hairline is a RING, not a border, and that is load-bearing: at 375 the tile's
// content box is 61px and the "Year 7" value needs 63px, so a real 1px border ate
// exactly the 2px that flipped it to "Yea…". A ring is a box-shadow — same 1px
// #E3E8F0 line at the same 12px radius, zero box-model cost.
export const INSET_TILE = 'ring-1 ring-border bg-surface-inset';

// Deepening the tile forces the negative ink down a step: the design-system default
// is text-destructive (#DC2626), which measures 4.58:1 on #F7F9FC but only 4.41:1 on
// #F1F5F9 — it FAILS AA on the new surface. --color-danger-strong (#B91C1C) is 6.16:1.
// The tone lives on the value span inside the primitive, so it is retargeted by
// selector rather than by editing src/modules/design-system.
export const INSET_TILE_NEGATIVE = `${INSET_TILE} [&>span:first-child]:text-danger-strong`;

// Same fix for the data-grid head row, which shipped at the same bg-background.
export const INSET_HEAD_ROW = 'bg-surface-inset';

// White panels rest at --shadow-md and hover to --shadow-lg (both already declared
// in tokens.css and both measured at zero uses across 49 surfaces).
export const PANEL_ELEVATION = 'shadow-md';
