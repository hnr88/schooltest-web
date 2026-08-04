// The vendored trigger ships a 32px `data-[size=default]:h-8` and a transparent
// fill; both are corrected HERE, from the wrapper, never in components/ui. The
// height override has to repeat the `data-[size=default]` variant or it loses on
// specificity to the primitive's own rule — a plain `h-11` silently does nothing.
export const TRIGGER =
  'min-h-11 w-full justify-between rounded-lg border-input bg-card px-3.5 text-lede font-medium text-foreground data-[size=default]:h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100';
