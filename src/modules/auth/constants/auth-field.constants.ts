// Canonical auth field chrome (design spec 06 §1.1/§1.5). Label 13.5/600 navy-800,
// input 44px tall at r10 on a 1px --input rule, blue focus rule + 3px ring, red rule
// + red ring on error, and the 12.5/500 destructive message with its leading glyph.
export const AUTH_LABEL_CLASS = 'text-body-sm font-semibold text-navy-800';

export const AUTH_INPUT_CLASS =
  'h-11 rounded-lg border-input bg-card px-3.5 text-body-md text-foreground transition-[color,border-color,box-shadow] duration-150 placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15';

export const AUTH_ERROR_CLASS =
  'inline-flex items-center gap-1.5 text-meta font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none';

export const AUTH_FIELD_CLASS = 'flex flex-col gap-1.5';
