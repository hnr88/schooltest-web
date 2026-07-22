import type { ComponentProps, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { AvatarTintTone } from './design-system.types';

export type PanelHeaderLevel = 'h2' | 'h3';

export interface PanelHeaderRowProps {
  title: string;
  as?: PanelHeaderLevel;
  titleId?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export interface KeyValueRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export type KeyValueListProps = ComponentProps<'dl'>;

export type TintTileTone = 'inset' | 'well' | 'brand' | 'accent';

export interface TintTileProps {
  tone?: TintTileTone;
  children: ReactNode;
  className?: string;
}

export interface NavyPanelProps {
  eyebrow?: string;
  value?: string;
  caption?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface NavyPromoCardProps {
  title: string;
  body: string;
  action?: ReactNode;
  watermarkSrc?: string;
  className?: string;
}

export type GlassStatTileTone = 'default' | 'accent';

export interface GlassStatTileProps {
  value: string;
  label: string;
  tone?: GlassStatTileTone;
  className?: string;
}

export interface BorderedCalloutProps {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export type ActivityTone = 'brand' | 'success' | 'warning' | 'accent';

export interface ActivityFeedRowProps {
  icon: LucideIcon;
  tone?: ActivityTone;
  children: ReactNode;
  timestamp: string;
  className?: string;
}

export interface DotActivityRowProps {
  tone?: ActivityTone;
  children: ReactNode;
  className?: string;
}

export interface RankRowProps {
  rank: number;
  name: string;
  initials: string;
  score: string;
  tone?: AvatarTintTone;
  className?: string;
}

export type ScoreProgressTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

export interface ScoreProgressRowProps {
  label: string;
  value: number;
  display: string;
  tone?: ScoreProgressTone;
  orientation?: 'row' | 'stacked';
  className?: string;
}

export type SkillVerdictTone = 'mastered' | 'emerging' | 'notYet' | 'notAssessed';

export interface SkillBreakdownRowProps {
  label: string;
  value: number | null;
  verdict: string;
  tone?: SkillVerdictTone;
  className?: string;
}

export interface NotesCardProps {
  title?: string;
  author?: string;
  timestamp?: string;
  children: ReactNode;
  className?: string;
}

export interface CompletionCellProps {
  value: number;
  display: string;
  ariaLabel: string;
  className?: string;
}

export type RowActionsClusterProps = ComponentProps<'div'>;

export interface AvatarStackEntry {
  initials: string;
  tone?: AvatarTintTone;
}

export interface AvatarStackProps {
  entries: readonly AvatarStackEntry[];
  max?: number;
  overflowLabel?: string;
  ariaLabel: string;
  className?: string;
}

export interface BarChartItem {
  label: string;
  value: number;
  display: string;
  current?: boolean;
}

export interface BarChartProps {
  items: readonly BarChartItem[];
  ariaLabel: string;
  max?: number;
  className?: string;
}

export interface SparklineProps {
  points: readonly number[];
  ariaLabel: string;
  className?: string;
}

export interface SkeletonCardProps {
  rows?: number;
  className?: string;
}

export interface UpcomingEventRowProps {
  month: string;
  day: string;
  title: string;
  meta?: string;
  trailing?: ReactNode;
  className?: string;
}
