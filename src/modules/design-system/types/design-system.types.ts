import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface LogoProps {
  variant?: 'lockup' | 'mark';
  theme?: 'color' | 'white';
  alt: string;
  height?: number;
  className?: string;
}

export interface EyebrowProps {
  tone?: 'blue' | 'teal';
  children: ReactNode;
  className?: string;
}

export interface StatusBadgeProps {
  status: 'live' | 'scheduled' | 'draft';
  label: string;
  className?: string;
}

export type TagProps = {
  label: string;
  className?: string;
} & (
  | { onRemove: () => void; removeLabel: string }
  | { onRemove?: undefined; removeLabel?: undefined }
);

export interface CountBadgeProps {
  count: number;
  ariaLabel?: string;
  className?: string;
}

export interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertProps = {
  variant?: AlertVariant;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
} & (
  | { onDismiss: () => void; dismissLabel: string }
  | { onDismiss?: undefined; dismissLabel?: undefined }
);

export type ProgressBarTone = 'solid' | 'gradient';

export interface ProgressBarProps {
  value: number;
  tone?: ProgressBarTone;
  ariaLabel: string;
  className?: string;
}

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
  icon: LucideIcon;
  tone?: FeatureCardTone;
  title: string;
  description: string;
  className?: string;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
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
