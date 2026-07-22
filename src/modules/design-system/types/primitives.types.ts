import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { AvatarTintSize, AvatarTintTone } from './design-system.types';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonTone = 'outline' | 'ghost' | 'soft' | 'danger';

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'aria-label'
> {
  icon: LucideIcon;
  label: string;
  size?: IconButtonSize;
  tone?: IconButtonTone;
  href?: string;
}

export interface TopbarSearchTriggerProps {
  href: string;
  placeholder: string;
  label: string;
  className?: string;
}

export interface UnderlineTabOption {
  value: string;
  label: string;
}

export interface UnderlineTabsProps {
  options: readonly UnderlineTabOption[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

export interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export type TimelineTagTone = 'blue' | 'teal' | 'amber' | 'violet' | 'pink' | 'neutral';

export interface TimelineRowProps {
  date: string;
  title: string;
  tag?: string;
  tagTone?: TimelineTagTone;
  trailing?: ReactNode;
  className?: string;
}

export type SubjectProgressTone = 'primary' | 'accent' | 'warning' | 'success' | 'danger';

export interface SubjectProgressCardProps {
  subject: string;
  value: number;
  valueLabel: string;
  progressLabel: string;
  meta?: string;
  tone?: SubjectProgressTone;
  className?: string;
}

export interface PersonCellProps {
  name: string;
  secondary?: string;
  initials?: string;
  tone?: AvatarTintTone;
  size?: AvatarTintSize;
  trailing?: ReactNode;
  className?: string;
}

export type ScoreTextTone = 'success' | 'warning' | 'danger' | 'neutral';
export type ScoreTextSize = 'sm' | 'md' | 'lg';

export interface ScoreTextProps {
  value: number | null;
  display?: string;
  emptyLabel?: string;
  tone?: ScoreTextTone;
  size?: ScoreTextSize;
  className?: string;
}
