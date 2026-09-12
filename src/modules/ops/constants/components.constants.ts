import type { SchoolPlan } from '@/modules/school-admin';

export const DATE_TIME = 'd MMM yyyy, HH:mm';

// Plan tiers exactly as api::school.school declares them. Spec §Plan System
// makes the full licence an OPS assignment, so this list is the ops console's
// switch - there is no self-serve path onto it.
export const SCHOOL_PLAN_OPTIONS: readonly SchoolPlan[] = ['trial', 'full_license'];

// OpsConfirmDialog's `skin`, one class string per part. `ops` (the default) is the
// portal's own confirm (`Ops Portal.dc.html:819-841`) and stays exactly as it was;
// `teacher` is `Teacher Portal v2.dc.html:1846-1853`: #FAFBFC r11 panel of 440 content
// + 30px sides, -0.01em title, #6B7280 / 1.55 body, 46px r8 buttons, 700 CTA, no border.
export const OPS_CONFIRM_SKIN_CLASSES = {
  ops: {
    panel: 'sm:max-w-[460px]',
    inner: 'p-7',
    title: 'text-[19px] leading-tight',
    description: 'mt-2.5 text-sm leading-relaxed text-[#64748B]',
    actions: 'mt-6 flex items-center justify-end gap-2.5',
    cancel: '',
    cta: '',
  },
  teacher: {
    panel: 'rounded-[11px] bg-[#FAFBFC] sm:max-w-[500px]',
    inner: 'px-[30px] py-7',
    title: 'text-[19px] leading-[normal] tracking-[-0.01em]',
    description: 'mt-2.5 text-sm leading-[1.55] text-pretty text-[#6B7280]',
    actions: 'mt-6 flex flex-wrap items-center gap-2.5',
    cancel: 'h-[46px] rounded-[8px] border-[#E5E7EB]',
    cta: 'h-[46px] rounded-[8px] border-0 px-[22px] font-bold',
  },
} as const;

