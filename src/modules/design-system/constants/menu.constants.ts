// Spec: container = white card, border #EEF1F6, radius 16, shadow 0 16px 40px
// rgba(14,35,80,.18), 6px padding — the portal designs' every dropdown panel
// (`Ops Portal.dc.html:180,404`, School Admin likewise). Radius is the literal
// 16px token (`--radius-panel`): the earlier `rounded-2xl` resolved to 18px on
// this token ladder (1.8 × 10px base) and missed the design by 2px. Items =
// 13.5/500 navy, subtle #F1F5F9 (muted) hover — the vendored primitives hover
// with bg-accent (teal in this token set), which the spec never uses for menu
// highlights.
export const CONTENT_CLASSES =
  'w-auto min-w-[212px] rounded-panel border border-[#EEF1F6] shadow-[0_16px_40px_rgba(14,35,80,0.18)] ring-0 p-1.5';

export const ITEM_CLASSES =
  'gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium focus:bg-muted focus:text-foreground [&_svg]:text-slate-500';

export const DESTRUCTIVE_HOVER_CLASSES =
  'data-[variant=destructive]:focus:bg-red-50 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-red-950/30';
