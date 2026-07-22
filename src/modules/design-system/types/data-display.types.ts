import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Canonical list/record surfaces (design-system-and-components — Students roster,
// Child profile, Student detail). Split out of design-system.types.ts to keep both
// files under the 200-line cap.

export type StatusPillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusPillProps {
  tone?: StatusPillTone;
  children: ReactNode;
  className?: string;
}

export type DataPanelProps = ComponentProps<'section'>;

export type DataGridRowElement = 'div' | 'article' | 'li';

export interface DataGridRowProps extends HTMLAttributes<HTMLElement> {
  element?: DataGridRowElement;
  interactive?: boolean;
  last?: boolean;
}

export type DataGridHeadRowProps = HTMLAttributes<HTMLElement>;

export type StatStripSize = 'md' | 'sm';

export type StatStripTone = 'default' | 'positive' | 'negative' | 'muted';

export interface StatStripItem {
  value: string;
  label: string;
  tone?: StatStripTone;
}

export interface StatStripProps {
  items: readonly StatStripItem[];
  size?: StatStripSize;
  ariaLabel: string;
  className?: string;
}

export interface FilterChipOption {
  value: string;
  label: string;
}

export interface FilterChipGroupProps {
  options: readonly FilterChipOption[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

export interface EmptyStateHeroProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}
