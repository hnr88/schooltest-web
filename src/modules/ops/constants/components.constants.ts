import type { SectionTimersFormValues } from '@/modules/ops/schemas/section-timers.schema';

export const DATE_TIME = 'd MMM yyyy, HH:mm';

export const SECTION_FIELDS: ReadonlyArray<{ stage: number; name: keyof SectionTimersFormValues }> = [
  { stage: 1, name: 'section1' },
  { stage: 2, name: 'section2' },
  { stage: 3, name: 'section3' },
];
