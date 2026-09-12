import { LayoutGrid, List } from 'lucide-react';

import type {
  TeacherButtonSize,
  TeacherButtonTone,
} from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 kit — control classes, drawn to the design's values
 * (research/design-surfaces.md §8.4). The theme's `rounded-lg`/`rounded-xl`
 * are 10/14px here, so every radius is written in pixels.
 */

/** The kit's keyboard focus ring (the design draws none; WCAG 2.4.7 needs one). */
export const KIT_FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-navy-900/25 focus-visible:ring-offset-1';

/**
 * `primary`, `ghost` and `inverse` draw no border at all (`border:none` in the
 * design, e.g. `:66`, `:256`, `:1046`), so they use `border-0` and not a
 * transparent 1px border — that border made every one of them 2px wider (P1
 * row 19). `outline`'s hover is the design's border-only `#0E2350` (`:542`,
 * `:1701`, `:476`, `:331`); the PDF/LLM pair, the one place the design also
 * tints the face (`:200`, `:705`), adds `#FAFBFC` itself (P1 row 23).
 */
export const TEACHER_BUTTON_TONES: Record<TeacherButtonTone, string> = {
  primary: 'border-0 bg-navy-900 text-white hover:bg-navy-800',
  outline: 'border-[#E5E7EB] bg-white text-navy-900 hover:border-navy-900 hover:bg-white',
  secondary: 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F5F6F8]',
  ghost: 'border-0 bg-transparent text-[#6B7280] hover:bg-transparent hover:text-[#DC2626]',
  dangerOutline: 'border-[#E9C4C0] bg-white text-[#B42318] hover:bg-[#FDEEEC]',
  inverse: 'border-0 bg-white text-navy-900 hover:bg-[#F5F6F8]',
};

export const TEACHER_BUTTON_SIZES: Record<TeacherButtonSize, string> = {
  xs: 'h-8 gap-1.5 rounded-[8px] px-3 text-[12.5px] font-semibold',
  sm: 'h-[34px] gap-2 rounded-[9px] px-3.5 text-[13px] font-medium',
  md: 'h-[38px] gap-2 rounded-[9px] px-4 text-[13.5px] font-medium',
  lg: 'h-10 gap-2 rounded-[10px] px-4 text-[13.5px] font-semibold',
  xl: 'h-[42px] gap-2 rounded-[8px] px-[18px] text-[13.5px] font-semibold',
  '2xl': 'h-[46px] gap-[9px] rounded-[10px] px-5 text-[14.5px] font-semibold',
};

/**
 * The design's search boxes are content-box divs, so their drawn size is the
 * declared size plus padding and border: grey 240+24+2 = 266 × 36+2 = 38
 * (`classes-list.png`); white 240+30+2 = 272 × 42+2 = 44 on the Students tab
 * (`class-detail-complete--results.png`), 40+2 = 42 on the Live tab.
 */
export const PILL_SEARCH_VARIANTS: Record<'grey' | 'white', { root: string; icon: string }> = {
  grey: {
    root: 'h-[38px] w-[266px] gap-[9px] rounded-[9px] border-transparent bg-[#F5F6F8] px-3 hover:border-[#E5E7EB]',
    icon: 'size-3.5 text-[#9CA3AF]',
  },
  white: {
    root: 'w-[272px] gap-2.5 rounded-[12px] border-[#ECEEF2] bg-white px-[15px]',
    icon: 'size-[15px] text-[#6B7280]',
  },
};

export const PILL_SEARCH_HEIGHTS: Record<'md' | 'lg', string> = {
  md: 'h-[42px]',
  lg: 'h-[44px]',
};

export const PILL_SELECT_SIZES: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'h-9 rounded-[9px] border-[#E5E7EB] px-[11px] text-[13.5px] font-medium text-[#374151]',
  md: 'h-[38px] rounded-[9px] border-[#E5E7EB] pr-8 pl-[13px] text-[13px] font-semibold text-navy-900',
  lg: 'h-10 rounded-[10px] border-[#ECEEF2] px-3 text-[13.5px] font-semibold text-navy-900',
  xl: 'h-[42px] rounded-[12px] border-[#ECEEF2] px-[14px] text-[13.5px] font-medium text-navy-900',
};

export const VIEW_TOGGLE_OPTIONS = [
  { value: 'tiles', Icon: LayoutGrid },
  { value: 'list', Icon: List },
] as const;

export const VIEW_TOGGLE_ACTIVE = 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(14,35,80,0.12)]';
export const VIEW_TOGGLE_IDLE = 'bg-transparent text-[#9CA3AF] hover:text-navy-900';

export const FILTER_PILL_SIZES: Record<'sm' | 'md', string> = {
  sm: 'px-[15px] py-2',
  md: 'h-[34px] px-3.5',
};

export const FILTER_PILL_ACTIVE = 'border-navy-900 bg-navy-900 font-semibold text-white';
export const FILTER_PILL_IDLE =
  'border-[#E4E9F2] bg-white font-medium text-[#3D4A5C] hover:border-navy-900';

export const BACK_BUTTON_CLASS =
  'mr-0.5 inline-flex h-[30px] items-center gap-[5px] rounded-[8px] border border-[#E5E7EB] bg-[#F3F5F9] pr-[11px] pl-2 text-[12.5px] font-semibold text-navy-900 transition-colors hover:bg-[#E8EEFB] motion-reduce:transition-none';
