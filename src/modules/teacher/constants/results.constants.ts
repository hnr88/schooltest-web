import { BookOpen, Headphones, Mic, PenLine } from 'lucide-react';

import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';
import type { LucideIcon } from 'lucide-react';

// The Results surface lives on the ONE dashboard shell (ASSUMPTION A4,
// .qa/DECISIONS.md) — the same path task 031's rail entry already points at
// (`src/modules/shell/constants/nav.constants.ts` RESULTS_HREF). Declared once
// here so the class list, the class detail and the tab shell never restate it.
export const RESULTS_PATH = '/dashboard/results';

/**
 * The six tabs of the class detail, in the design export's label order
 * (`Teacher Portal v2.dc.html:3154–3166`): Students · Class progress ·
 * Teaching insights · Exit predictions · Family reports · Live sessions.
 * `?tab=` carries these values; the design's own `results` key is accepted as
 * an alias of `students` (`lib/results-shell.ts`).
 */
export const RESULTS_TAB_ORDER = [
  'students',
  'progress',
  'insights',
  'exit',
  'reports',
  'live',
] as const;

export const DEFAULT_RESULTS_TAB = 'students';

/**
 * Teacher Portal v2 class detail (`:520–638`): breadcrumb, header, skill strip
 * and tab row stay pinned at the top of the scroll column while a tab body
 * scrolls. The block overlays the card's own border — its margin is one pixel
 * past the card's 26/30 padding — as the design draws it.
 */
export const CLASS_DETAIL_STICKY_CLASS =
  'sticky top-0 z-6 -mx-[31px] -mt-[27px] flex flex-col gap-4 rounded-t-[14px] border border-b-0 border-[#ECEEF2] bg-white px-[31px] pt-[27px] shadow-[0_1px_0_rgba(14,35,80,0.04)]';

/** The section tab row (`:632–638`): no gaps, wraps, one #ECEEF2 hairline under it. */
export const RESULTS_TABS_LIST_CLASS =
  'flex h-auto w-full flex-wrap items-stretch justify-start gap-0 rounded-none border-b border-[#ECEEF2] bg-transparent p-0 group-data-horizontal/tabs:h-auto';

/**
 * One section tab: 14/22 padding, 15.5px, a 3px underline overlapping the row's
 * hairline; active 700 navy, idle 500 #7C8698. The primitive's `::after`
 * underline is switched off — the bottom border is the design's underline.
 */
export const RESULTS_TAB_TRIGGER_CLASS =
  'h-auto flex-none rounded-none border-0 border-b-[3px] border-transparent -mb-px px-[22px] py-3.5 text-[15.5px] leading-[normal] font-medium text-[#7C8698] transition-colors duration-200 ease-out after:hidden hover:text-navy-900 data-active:border-navy-900 data-active:font-bold data-active:text-navy-900 motion-reduce:transition-none';

/**
 * A tab body carries no chrome of its own — the card's 20px column gap spaces
 * it. Base UI's panel takes `tabIndex=0`, so keyboard focus gets a ring here.
 */
export const RESULTS_TAB_PANEL_CLASS =
  'min-w-0 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-navy-900/25 focus-visible:ring-offset-2';

/** The skill strip's icon per skill (`:606–630`). */
export const SKILL_TAB_ICONS: Record<SkillScopeValue, LucideIcon> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

/** One skill card (`:598–630`): flex 1 1 150px, 10/13 padding, radius 10, 1px border. */
export const SKILL_TAB_CLASS =
  'h-auto flex-[1_1_150px] justify-start gap-2.5 rounded-[10px] border px-[13px] py-2.5 text-left leading-[normal] shadow-none group-data-[variant=default]/tabs-list:data-active:shadow-none';

/** skillTab (design l.2729): selected navy · unselected Reading · unselected soon skill. */
export const SKILL_TAB_TONES = {
  selected: {
    root: 'border-navy-900 bg-navy-900 text-white hover:text-white data-active:border-navy-900 data-active:bg-navy-900 data-active:text-white',
    icon: '',
    sub: 'text-[#AEBBD6]',
    chip: 'bg-white/16 text-white',
  },
  live: {
    root: 'border-[#ECEEF2] bg-[#F7F8FA] text-navy-900 hover:text-navy-900',
    icon: '',
    sub: 'text-[#1F7A4D]',
    chip: '',
  },
  soon: {
    root: 'border-[#ECEEF2] bg-[#F7F8FA] text-[#5B6472] hover:text-[#5B6472]',
    icon: 'opacity-55',
    sub: 'text-[#9CA3AF]',
    chip: 'bg-[#EAEDF2] text-[#8A94A6]',
  },
} as const;
