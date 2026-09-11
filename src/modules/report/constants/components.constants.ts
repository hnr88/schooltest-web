import type { ReportViewMode } from '@/modules/report/types/report-view.types';
import type { ReviewPhase } from '@/modules/report/types/review.types';

export const ROW_CLASS =
  'flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none';

export const HATCH = 'repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 6px)';

export const ERROR_PATTERN_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-300 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

export const ABSENT_KEY = {
  not_derived: 'observationsNotDerived',
  not_applicable: 'observationsNotApplicable',
} as const;

export const MODES: readonly ReportViewMode[] = ['teacher', 'parent'];

export const ATTRIBUTE_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-150 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

export const OBSERVATION_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-250 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

export const PARENT_SUBSKILL_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-100 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

export const SUPPLEMENTARY_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-200 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

// The review drawer's shared class strings — Teacher Portal v2 S31's exact
// values (the rebuilt teacher surfaces carry the design's hexes verbatim).
export const REVIEW_FOCUS = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

export const REVIEW_EYEBROW =
  'text-[11.5px] font-semibold tracking-[0.05em] text-[#9CA3AF] uppercase';

export const REVIEW_CHIP = 'rounded-full px-[11px] py-1 text-xs font-semibold';

export const REVIEW_ANSWER_BOX = 'flex-[1_1_200px] rounded-lg border border-[#ECEEF2] px-3.5 py-[11px]';

export const REVIEW_TONE_CHIP = {
  full: 'bg-[#E9F6EF] text-[#1F7A4D]',
  zero: 'bg-[#FDEEEC] text-[#B42318]',
  unknown: 'bg-[#F5F6F8] text-[#0E2350]',
  pending: 'bg-[#FDF3E0] text-[#92610B]',
} as const;

export const REVIEW_PHASES: readonly ReviewPhase[] = [
  'beginning',
  'emerging',
  'developing',
  'consolidating',
];
