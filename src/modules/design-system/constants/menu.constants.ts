// Spec (DS doc §11): container = white card, border #E3E8F0, radius 12, shadow-lg, 6px
// padding; items = 13.5/500 navy, slate icons, subtle #F1F5F9 (muted) hover — the
// vendored primitives hover with bg-accent (teal in this token set), which the spec
// never uses for menu highlights.
export const CONTENT_CLASSES = 'min-w-50 rounded-xl border border-border shadow-lg ring-0 p-1.5';

export const ITEM_CLASSES =
  'gap-2.5 rounded-md px-2.5 py-2 font-medium focus:bg-muted focus:text-foreground [&_svg]:text-slate-500';

export const DESTRUCTIVE_HOVER_CLASSES =
  'data-[variant=destructive]:focus:bg-red-50 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-red-950/30';
