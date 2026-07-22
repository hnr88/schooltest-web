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
export { MetricCard } from './components/metric-card';
export { MiniStatTile } from './components/mini-stat-tile';
export { TrendDelta } from './components/trend-delta';
export { GaugeRing } from './components/gauge-ring';
export { InsightCallout } from './components/insight-callout';
export { AvatarTint, getAvatarTone } from './components/avatar-tint';
export { FeatureCard } from './components/feature-card';
export { EmptyState } from './components/empty-state';
export { PresenceAvatar } from './components/presence-avatar';
export { SegmentedControl } from './components/segmented-control';
export { DataPanel } from './components/data-panel';
export { DataGridHeadRow, DataGridRow } from './components/data-grid-row';
export { StatusPill } from './components/status-pill';
export { StatStrip } from './components/stat-strip';
export { FilterChipGroup } from './components/filter-chip-group';
export { EmptyStateHero } from './components/empty-state-hero';
export { IconButton } from './components/icon-button';
export { TopbarSearchTrigger } from './components/topbar-search-trigger';
export { UnderlineTabs } from './components/underline-tabs';
export { ToggleRow } from './components/toggle-row';
export { TimelineRow } from './components/timeline-row';
export { SubjectProgressCard } from './components/subject-progress-card';
export { PersonCell } from './components/person-cell';
export { ScoreText, getScoreTone } from './components/score-text';
export { getInitials } from './lib/initials';
export type {
  IconButtonSize,
  IconButtonTone,
  IconButtonProps,
  TopbarSearchTriggerProps,
  UnderlineTabOption,
  UnderlineTabsProps,
  ToggleRowProps,
  TimelineTagTone,
  TimelineRowProps,
  SubjectProgressTone,
  SubjectProgressCardProps,
  PersonCellProps,
  ScoreTextTone,
  ScoreTextSize,
  ScoreTextProps,
} from './types/primitives.types';
export type {
  StatusPillTone,
  StatusPillProps,
  DataPanelProps,
  DataGridRowElement,
  DataGridRowProps,
  DataGridHeadRowProps,
  StatStripSize,
  StatStripTone,
  StatStripItem,
  StatStripProps,
  FilterChipOption,
  FilterChipGroupProps,
  EmptyStateHeroProps,
} from './types/data-display.types';
export type {
  EmptyStateTone,
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
  MetricCardIconTone,
  MetricCardSize,
  MetricCardTone,
  MetricCardAction,
  MetricCardProps,
  MiniStatTileTone,
  MiniStatTileProps,
  TrendDeltaTone,
  TrendDeltaProps,
  GaugeRingProps,
  InsightCalloutTone,
  InsightCalloutProps,
  AvatarTintTone,
  AvatarTintSize,
  AvatarTintProps,
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
