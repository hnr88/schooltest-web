import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatCardIconTone = 'blue' | 'teal' | 'navy';

export type StatCardDeltaTone = 'positive' | 'neutral';

export interface StatCardProps {
  icon: LucideIcon;
  iconTone?: StatCardIconTone;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: StatCardDeltaTone;
  progress?: number;
  className?: string;
}

export type FeatureCardTone = 'light' | 'navy';

export interface FeatureCardProps {
  icon: ComponentType<{ className?: string }>;
  tone?: FeatureCardTone;
  title: string;
  description: string;
  className?: string;
}

export type EmptyStateTone = 'brand' | 'muted';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: EmptyStateTone;
  className?: string;
}

export type PresenceAvatarSize = 'sm' | 'default' | 'lg' | 'xl';

export type PresenceStatus = 'online' | 'offline';

export interface PresenceAvatarProps {
  initials: string;
  size?: PresenceAvatarSize;
  presence?: PresenceStatus;
  className?: string;
}

export type AvatarTintTone = 'blue' | 'teal' | 'amber' | 'sky' | 'pink' | 'violet';

export type AvatarTintSize = 'sm' | 'md' | 'lg';

export interface AvatarTintProps {
  initials: string;
  tone?: AvatarTintTone;
  size?: AvatarTintSize;
  className?: string;
}

export type MiniStatTileTone = 'default' | 'positive' | 'negative' | 'muted';

export interface MiniStatTileProps {
  value: string;
  label: string;
  tone?: MiniStatTileTone;
  className?: string;
}

export type TrendDeltaTone = 'positive' | 'neutral' | 'negative';

export interface TrendDeltaProps {
  label: string;
  tone?: TrendDeltaTone;
  showIcon?: boolean;
  className?: string;
}

export type MetricCardIconTone = 'blue' | 'teal' | 'amber' | 'danger';

export type MetricCardSize = 'md' | 'lg';

export type MetricCardTone = 'light' | 'navy';

export interface MetricCardAction {
  href: string;
  label: string;
}

export interface MetricCardProps {
  icon: LucideIcon;
  iconTone?: MetricCardIconTone;
  label: string;
  value: string;
  size?: MetricCardSize;
  tone?: MetricCardTone;
  action?: MetricCardAction;
  delta?: string;
  deltaTone?: TrendDeltaTone;
  progress?: number;
  progressLabel?: string;
  className?: string;
}

export interface GaugeRingProps {
  value: number;
  display: string;
  caption?: string;
  ariaLabel: string;
  className?: string;
}

export type InsightCalloutTone = 'info' | 'success' | 'warning' | 'danger';

export interface InsightCalloutProps {
  icon: LucideIcon;
  tone?: InsightCalloutTone;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}
