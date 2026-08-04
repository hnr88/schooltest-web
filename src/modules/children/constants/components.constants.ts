import type { ChildJourneyRung } from '@/modules/children/types/children.types';

export const DOT_CLASSES: Record<ChildJourneyRung['state'], string> = {
  done: 'border-foreground bg-foreground',
  current: 'border-foreground bg-foreground',
  future: 'border-portal-input bg-card',
};

export const LABEL_CLASSES: Record<ChildJourneyRung['state'], string> = {
  done: 'font-medium text-foreground',
  current: 'font-bold text-foreground',
  future: 'font-medium text-muted-foreground',
};

export const KPI_CELLS = [0, 1, 2, 3];

export const RAILS = [0, 1, 2];

export const ROWS = [0, 1, 2];

export const LEDE_ON_WELL = '[&_p+p]:text-body';

export const PAGE_BUTTON =
  'relative inline-grid size-8 place-items-center rounded-full text-meta font-semibold tabular-nums transition-colors duration-200 ease-out-expo after:absolute after:-inset-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none';

export const CARDS = [0, 1, 2, 3];

export const CELLS = [0, 1, 2];

export const SEARCH_FIELD =
  'contents [&_[data-slot=input-group]]:h-10 [&_[data-slot=input-group]]:rounded-full [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]_input]:min-h-11 [&_[data-slot=input-group]_button]:relative [&_[data-slot=input-group]_button]:after:absolute [&_[data-slot=input-group]_button]:after:-inset-2.75';
