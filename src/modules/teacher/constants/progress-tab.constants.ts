import { TrendingUp, TriangleAlert, type LucideIcon } from 'lucide-react';

import type { ProgressWatchVariant } from '@/modules/teacher/types/progress-tab.types';
import type { KpiCardTone } from '@/modules/teacher/types/teacher-kit.types';
import type { ProgressTileId } from '@/modules/teacher/types/v2-class-tabs.types';

export const PROGRESS_I18N_NAMESPACE = 'TeacherPortal.progress';

/** The class chart's inks (`Teacher Portal v2.dc.html:901–919`): #C2C8D2 axes, navy line, grey band labels. */
export const CLASS_CHART_STYLE = {
  axis: '#C2C8D2',
  line: '#0E2350',
  pointFill: '#FFFFFF',
  bandLabel: '#8A94A6',
  xLabel: '#4B5563',
  xSub: '#B6BCC7',
} as const;

/** Gained green, Held steady navy, Slipped red (`:3926–3929`); Mean shift takes its sign's tone. */
export const PROGRESS_TILE_TONE: Readonly<Record<Exclude<ProgressTileId, 'meanShift'>, KpiCardTone>> = {
  gained: 'success',
  held: 'navy',
  slipped: 'danger',
};

/** The two white list cards beside the chart (`:923–952`): icon, its ink, and their copy keys. */
export const PROGRESS_WATCH_VARIANT: Readonly<
  Record<ProgressWatchVariant, { icon: LucideIcon; iconClass: string; titleKey: string; emptyKey: string }>
> = {
  gains: { icon: TrendingUp, iconClass: 'text-[#1F7A4D]', titleKey: 'top.title', emptyKey: 'top.empty' },
  support: { icon: TriangleAlert, iconClass: 'text-[#92610B]', titleKey: 'watch.title', emptyKey: 'watch.empty' },
};
