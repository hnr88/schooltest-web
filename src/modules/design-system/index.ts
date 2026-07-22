export { Button, type ButtonProps } from './components/button';
export { Badge, type BadgeProps } from './components/badge';
export { StatusBadge } from './components/status-badge';
export { Tag } from './components/tag';
export { CountBadge } from './components/count-badge';
export { NavCountBadge } from './components/nav-count-badge';
export { Logo } from './components/logo';
export { Eyebrow } from './components/eyebrow';
export { Container, Section } from './components/layout';
export { Alert } from './components/alert';
export { ProgressBar } from './components/progress-bar';
export { StatCard } from './components/stat-card';
export { FeatureCard } from './components/feature-card';
export { EmptyState } from './components/empty-state';
export { PresenceAvatar } from './components/presence-avatar';
export { SegmentedControl } from './components/segmented-control';
export type {
  LogoProps,
  EyebrowProps,
  StatusBadgeProps,
  TagProps,
  CountBadgeProps,
  NavCountBadgeProps,
  ContainerProps,
  SectionProps,
  AlertVariant,
  AlertProps,
  ProgressBarTone,
  ProgressBarProps,
  StatCardIconTone,
  StatCardDeltaTone,
  StatCardProps,
  FeatureCardTone,
  FeatureCardProps,
  EmptyStateProps,
  PresenceAvatarSize,
  PresenceStatus,
  PresenceAvatarProps,
  SegmentedControlOption,
  SegmentedControlProps,
} from './types/design-system.types';

// read-only ui primitives (single import surface)
export * from './primitives';

// showcase
export * from './components/showcase';
