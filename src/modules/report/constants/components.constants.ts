import type { ReportViewMode } from '@/modules/report/types/report-view.types';

export const ROW_CLASS =
  'flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none';

export const HATCH = 'repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 6px)';

export const ERROR_PATTERN_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-300 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

export const ABSENT_KEY = {
  not_derived: 'observationsNotDerived',
  not_applicable: 'observationsNotApplicable',
  unclassified: 'observationsUnclassified',
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
