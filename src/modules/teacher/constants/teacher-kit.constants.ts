import type {
  AcaraPhaseKey,
  BandKey,
  ClassBadgeSize,
  ClassBadgeTone,
  DeltaDirection,
  InitialsAvatarSize,
  InitialsAvatarTone,
  KpiCardTone,
  KpiCardVariant,
  TeacherPageCardVariant,
  TeacherStatus,
  ToneChipSize,
  ToneChipTone,
} from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 kit — the design's exact values (`Teacher Portal
 * v2.dc.html`; research/design-surfaces.md §8). The design draws Tailwind-gray
 * neutrals, not the slate shadcn tokens, so literal values stand where no token
 * matches; `navy-900` (#0E2350) and `navy-800` (#16326E) are the tokens that do.
 *
 * One deliberate deviation: the design's tertiary TEXT grey #9CA3AF (and the
 * "Soon" #B6BCC7) sit at 2.5:1 / 1.9:1 on white, which fails WCAG AA and the
 * teacher axe gate (`tests/e2e/teacher-a11y.spec.ts`). The kit draws tertiary
 * text in the design's own secondary grey #6B7280 (4.8:1). Icons and hairlines
 * keep #9CA3AF.
 */

export const PAGE_CARD_VARIANTS: Record<TeacherPageCardVariant, string> = {
  flush: 'overflow-hidden',
  padded: 'flex flex-col gap-5 px-[30px] pt-[26px] pb-[30px]',
};

/** The design-system StatusPill tone each kit tone reports as `data-tone`. */
export const TONE_CHIP_DS_TONE: Record<
  ToneChipTone,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  scheduled: 'warning',
  today: 'warning',
  danger: 'danger',
  navy: 'neutral',
  neutral: 'neutral',
  slate: 'neutral',
};

/** fg / bg pairs (design-surfaces §8.3). */
export const TONE_CHIP_CLASSES: Record<ToneChipTone, string> = {
  success: 'bg-[#E9F6EF] text-[#1F7A4D]',
  info: 'bg-[#EAF0FB] text-[#1A3B8B]',
  warning: 'bg-[#FDF4E3] text-[#92610B]',
  scheduled: 'bg-[#FDF4E3] text-[#8A5A00]',
  today: 'bg-[#FDF3E0] text-[#92610B]',
  danger: 'bg-[#FDEEEC] text-[#B42318]',
  navy: 'bg-[#EEF1F6] text-navy-900',
  neutral: 'bg-[#F1F3F6] text-[#5B6472]',
  slate: 'bg-[#EEF1F6] text-[#5A6478]',
};

export const TONE_CHIP_SIZES: Record<ToneChipSize, string> = {
  xs: 'gap-1 px-2 py-0.5 text-[10.5px] font-bold tracking-[0.04em] uppercase',
  sm: 'gap-1.5 px-[9px] py-[3px] text-[11.5px] font-semibold tracking-normal normal-case',
  md: 'gap-1.5 px-2.5 py-1 text-[12px] font-semibold tracking-normal normal-case',
  lg: 'gap-1.5 px-3 py-[5px] text-[12px] font-semibold tracking-normal normal-case',
  xl: 'gap-[7px] px-3.5 py-[7px] text-[12px] font-semibold tracking-normal normal-case',
};

type PillStatus = Exclude<TeacherStatus, 'live'>;

export const STATUS_TONE: Record<PillStatus, ToneChipTone> = {
  sittingNow: 'danger',
  scheduled: 'scheduled',
  noTests: 'neutral',
  complete: 'success',
  today: 'today',
};

/** The list row's plain dot, in the status ink. */
export const STATUS_DOT_CLASSES: Record<PillStatus, string> = {
  sittingNow: 'bg-[#B42318]',
  scheduled: 'bg-[#8A5A00]',
  noTests: 'bg-[#5B6472]',
  complete: 'bg-[#1F7A4D]',
  today: 'bg-[#92610B]',
};

/** The solid red LIVE badge per placement (strip chip, list row, tile, monitor head). */
export const LIVE_BADGE_SIZES: Record<'xs' | 'sm' | 'md' | 'lg', { root: string; dot: string }> = {
  xs: { root: 'py-[3px] pr-2 pl-[7px] text-[10.5px] tracking-[0.08em]', dot: 'size-1.5 animate-om-pulse-slow' },
  sm: { root: 'py-[3px] pr-[9px] pl-2 text-[10.5px] tracking-[0.07em]', dot: 'size-1.5 animate-om-pulse' },
  md: { root: 'py-1 pr-2.5 pl-[9px] text-[11px] tracking-[0.08em]', dot: 'size-[7px] animate-om-pulse' },
  lg: { root: 'py-1 pr-[11px] pl-[9px] text-[11px] tracking-[0.08em]', dot: 'size-[7px] animate-om-pulse' },
};

/** C-TD-1 `classes[].status` → the kit's status key. */
export const CLASS_STATUS_KEY = {
  sitting_now: 'sittingNow',
  scheduled: 'scheduled',
  no_tests_yet: 'noTests',
  complete: 'complete',
} as const satisfies Record<'sitting_now' | 'scheduled' | 'no_tests_yet' | 'complete', TeacherStatus>;

export const CLASS_BADGE_SIZES: Record<ClassBadgeSize, string> = {
  sm: 'size-[34px] rounded-[9px] text-[12px] font-semibold',
  md: 'size-10 rounded-[10px] text-[13px] font-semibold',
  lg: 'size-14 rounded-[10px] text-[16px] font-bold',
};

export const CLASS_BADGE_TONES: Record<ClassBadgeTone, string> = {
  neutral: 'bg-[#F3F4F6] text-[#374151]',
  soft: 'bg-[#EEF1F6] text-navy-900',
  navy: 'bg-navy-900 text-white',
};

export const DELTA_COLOURS: Record<DeltaDirection, string> = {
  up: 'text-[#1F7A4D]',
  down: 'text-[#B42318]',
  flat: 'text-[#5B6472]',
  none: 'text-[#6B7280]',
};

export const DELTA_DS_TONE: Record<DeltaDirection, 'positive' | 'neutral' | 'negative'> = {
  up: 'positive',
  down: 'negative',
  flat: 'neutral',
  none: 'neutral',
};

export const DELTA_SIZES: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'text-[11.5px]',
  sm: 'text-[12.5px]',
  md: 'text-[14px]',
  lg: 'text-[15px]',
};

export const KPI_TONES: Record<KpiCardTone, string> = {
  navy: 'text-navy-900',
  success: 'text-[#1F7A4D]',
  danger: 'text-[#B42318]',
  warning: 'text-[#92610B]',
};

const KPI_LABEL = 'font-semibold tracking-[0.05em] text-[#6B7280] uppercase';
const KPI_VALUE = 'leading-[1.15] font-normal tracking-[-0.02em] tabular-nums';

export const KPI_VARIANTS: Record<
  KpiCardVariant,
  { root: string; label: string; value: string; sub: string }
> = {
  insight: {
    root: 'px-6 py-[22px]',
    label: `text-[12px] ${KPI_LABEL}`,
    value: `mt-[9px] text-[28px] ${KPI_VALUE}`,
    sub: 'mt-1.5 text-[12.5px] text-[#6B7280]',
  },
  progress: {
    root: 'px-[22px] py-5',
    label: `text-[11.5px] ${KPI_LABEL}`,
    value: `mt-[9px] text-[26px] ${KPI_VALUE}`,
    sub: 'mt-1 text-[12.5px] text-[#6B7280]',
  },
  count: {
    root: 'px-5 py-[18px]',
    label: 'mt-2 text-[12.5px] text-[#6B7280]',
    value: 'text-[30px] leading-none font-normal tracking-[-0.03em] tabular-nums',
    sub: 'mt-1 text-[12px] text-[#6B7280]',
  },
};

export const SECTION_CARD_PADDING: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'px-[18px] py-4',
  md: 'px-[22px] py-5',
  lg: 'px-[26px] py-6',
};

/** phaseChip (design l.1981): Consolidating green · Developing blue · Emerging amber · Beginning red. */
export const PHASE_TONE: Record<AcaraPhaseKey, ToneChipTone> = {
  consolidating: 'success',
  developing: 'info',
  emerging: 'warning',
  beginning: 'danger',
};

/** subBand (design l.1975): Secure green · Developing blue · Emerging amber · Not yet red. */
export const BAND_TONE: Record<BandKey, ToneChipTone> = {
  secure: 'success',
  developing: 'info',
  emerging: 'warning',
  notYet: 'danger',
};

export const AVATAR_SIZES: Record<InitialsAvatarSize, string> = {
  xs: 'size-[30px] text-[12px] font-semibold',
  sm: 'size-[34px] text-[12.5px] font-semibold',
  md: 'size-9 text-[13px] font-semibold',
  lg: 'size-10 text-[13px] font-semibold',
  xl: 'size-14 text-[18px] font-bold',
};

export const AVATAR_TONES: Record<InitialsAvatarTone, string> = {
  grey: 'bg-[#F5F6F8] text-navy-900',
  soft: 'bg-[#EEF1F6] text-navy-900',
  blue: 'bg-[#E8EEFB] text-navy-900',
  navy: 'bg-navy-900 text-white',
};
