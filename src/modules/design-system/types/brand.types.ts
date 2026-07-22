import type { ReactNode } from 'react';

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
  { onRemove: () => void; removeLabel: string } | { onRemove?: undefined; removeLabel?: undefined }
);

export interface CountBadgeProps {
  count: number;
  ariaLabel?: string;
  className?: string;
}

export interface NavCountBadgeProps {
  count: number;
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
