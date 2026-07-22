import type {
  MetricCardIconTone,
  MetricCardSize,
  MetricCardTone,
} from '@/modules/design-system/types/design-system.types';

export const TILE_TONES: Record<MetricCardIconTone, string> = {
  blue: 'bg-blue-50 text-primary',
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-destructive',
};

export const VALUE_SIZES: Record<MetricCardSize, string> = {
  md: 'text-stat-lg',
  lg: 'text-stat-xl',
};

// THE RULE, verbatim from .qa/CONTRAST-SPEC.md (metricSpec) — this is why exactly
// one card in a row may be navy:
//   "A metric card is navy if and only if it is the account-state card — the figure
//    the account itself is measured by, carrying the account's primary action. Every
//    purely-measurement KPI is white."
// Canonical source is App Screens → Billing, card 1 of 3. The dark↔light delta there
// is exactly four properties: background, border (DROPPED, never recoloured), label
// ink and value ink. Radius and padding stay byte-identical to the light siblings.
// Green/red deltas never survive onto navy anywhere in the corpus, so `delta` and
// `progress` are not rendered for tone="navy" — the CTA link takes the delta slot.
export const TONE_CLASSES: Record<MetricCardTone, string> = {
  light: 'border border-border bg-card shadow-sm hover:shadow-md',
  navy: 'border-0 bg-navy-900 shadow-none hover:shadow-dark-lift',
};

// AA on #0E2350: label #8FA3C7 = 5.99:1, value #FFFFFF = 15.27:1.
export const LABEL_TONES: Record<MetricCardTone, string> = {
  light: 'text-muted-foreground',
  navy: 'text-navy-muted',
};

export const VALUE_TONES: Record<MetricCardTone, string> = {
  light: 'text-foreground',
  navy: 'text-white',
};

// Icon chip on navy: #16326E fill, #5EEAD4 stroke (Landing dark feature card), scaled
// to this card's 34px chip. NOT rgba(255,255,255,.07) — that is canonical for glass
// tiles inside a navy hero band, not for an icon chip.
export const NAVY_TILE = 'bg-navy-800 text-accent-on-dark-hover';

// CTA ink: #2DD4BF → #5EEAD4 on navy (8.21:1 / 10.32:1). Blue never appears as a
// foreground on navy in 79 canonical screens — this is the hard substitution.
export const ACTION_TONES: Record<MetricCardTone, string> = {
  light: 'text-primary hover:text-blue-700',
  navy: 'text-accent-on-dark hover:text-accent-on-dark-hover',
};

// 13px inline CTA: the ::after keeps the canonical type size while giving the link a
// 47px-tall pointer target, the same idiom IconButton and the shell rail use.
export const ACTION_LINK_CLASSES =
  'relative mt-1.5 w-fit text-caption font-semibold transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-3.5 motion-reduce:transition-none';
