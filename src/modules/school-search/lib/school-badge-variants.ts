import { cva, type VariantProps } from 'class-variance-authority';

import type { SectorValue } from '@/modules/school-search/types/school-search.types';

// Card pills mapped onto the spec §6 badge palette:
//   info    = Default (#EFF5FF / #16326E)  — CRICOS / ELICOS
//   teal    = Accent  (#CCFBF1 / #0D9488)  — Scholarships
//   neutral = Neutral (#F1F5F9 / #475569)  — schoolType
//   outline = Outline (white + #CBD5E1)    — state code
//   blue/teal/violet = §8 category colours  — sector pill (uppercase)
export const pillVariants = cva(
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
        violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
        neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        info: 'bg-blue-50 text-navy-800 dark:bg-blue-950 dark:text-blue-200',
        outline: 'border border-input bg-card text-navy-800 dark:text-blue-200',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type PillTone = NonNullable<VariantProps<typeof pillVariants>['tone']>;

export const SECTOR_TONE: Record<SectorValue, PillTone> = {
  government: 'blue',
  'non-government': 'teal',
  catholic: 'violet',
};
