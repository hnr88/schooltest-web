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
// Choice / select family — the canonical small-enum controls.
export { FieldShell, describedBy } from './components/field-shell';
export { SelectionCardGroup } from './components/selection-card';
export { ChoicePillGroup } from './components/choice-pill-group';
export { SegmentedChoice } from './components/segmented-choice';
export { SelectField } from './components/select-field';
export { SelectRow } from './components/select-row';
// Media / result surfaces.
export { MediaCover } from './components/media-cover';
export { MediaCard } from './components/media-card';
export { FilterRail } from './components/filter-rail';
export { FilterRailSection } from './components/filter-rail-section';
export { MapPanelFrame } from './components/map-panel-frame';
// Record surfaces, rows and charts.
export { PanelHeaderRow } from './components/panel-header-row';
export { KeyValueList, KeyValueRow } from './components/key-value-row';
export { TintTile } from './components/tint-tile';
export { NavyPanel } from './components/navy-panel';
export { NavyPromoCard } from './components/navy-promo-card';
export { GlassStatTile } from './components/glass-stat-tile';
export { BorderedCallout } from './components/bordered-callout';
export { ActivityFeedRow, DotActivityRow } from './components/activity-feed-row';
export { RankRow } from './components/rank-row';
export { ScoreProgressRow } from './components/score-progress-row';
export { SkillBreakdownRow } from './components/skill-breakdown-row';
export { NotesCard } from './components/notes-card';
export { CompletionCell } from './components/completion-cell';
export { RowActionsCluster } from './components/row-actions-cluster';
export { AvatarStack } from './components/avatar-stack';
export { BarChart } from './components/bar-chart';
export { Sparkline } from './components/sparkline';
export { SkeletonCard } from './components/skeleton-card';
export { UpcomingEventRow } from './components/upcoming-event-row';
export { getInitials } from './lib/initials';
export type {
  ChoiceOption,
  ChoicePillSize,
  ChoicePillGroupProps,
  SelectionCardGroupProps,
  SegmentedChoiceProps,
  FieldShellProps,
  SelectFieldProps,
  SelectRowProps,
} from './types/choice.types';
export type {
  MediaRatio,
  MediaCoverProps,
  MediaCardProps,
  FilterRailProps,
  FilterRailSectionProps,
  MapPanelFrameProps,
} from './types/media.types';
export type {
  PanelHeaderRowProps,
  KeyValueRowProps,
  KeyValueListProps,
  TintTileTone,
  TintTileProps,
  NavyPanelProps,
  NavyPromoCardProps,
  GlassStatTileTone,
  GlassStatTileProps,
  BorderedCalloutProps,
  ActivityTone,
  ActivityFeedRowProps,
  DotActivityRowProps,
  RankRowProps,
  ScoreProgressTone,
  ScoreProgressRowProps,
  SkillVerdictTone,
  SkillBreakdownRowProps,
  NotesCardProps,
  CompletionCellProps,
  RowActionsClusterProps,
  AvatarStackEntry,
  AvatarStackProps,
  BarChartItem,
  BarChartProps,
  SparklineProps,
  SkeletonCardProps,
  UpcomingEventRowProps,
} from './types/record.types';
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
  SegmentedControlSize,
} from './types/design-system.types';

// read-only ui primitives (single import surface)
export * from './primitives';

// showcase
export * from './components/showcase';
