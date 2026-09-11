/**
 * Teacher Portal v2 kit — the presentational pieces shared by the teacher
 * screens (`Teacher Portal v2.dc.html`). Import from here; add to it, never
 * fork it. Screens own data and behaviour; these own the design's pixels.
 */
export { TeacherPageCard } from './TeacherPageCard';
export { TeacherPageHeader } from './TeacherPageHeader';
export { TeacherButton } from './TeacherButton';
export { ExportButtons } from './ExportButtons';
export { ToneChip } from './ToneChip';
export { TeacherStatusPill } from './TeacherStatusPill';
export { ClassBadge } from './ClassBadge';
export { DeltaText } from './DeltaText';
export { PillSearch } from './PillSearch';
export { PillSelect } from './PillSelect';
export { ViewToggle } from './ViewToggle';
export { KpiCard } from './KpiCard';
export { SectionCard } from './SectionCard';
export { PhaseChip } from './PhaseChip';
export { BandChip } from './BandChip';
export { InitialsAvatar } from './InitialsAvatar';
export { BackButton } from './BackButton';
export { Breadcrumbs } from './Breadcrumbs';
export { FilterPills } from './FilterPills';
// The ONE coming-soon body (class skill tabs, Exit predictions, student page),
// restyled to the design in place rather than duplicated here.
export { ComingSoonPanel } from '../ComingSoonPanel';

export { acaraPhaseKey, bandKey, classBadgeCode, formatDelta } from '@/modules/teacher/lib/teacher-kit';
export { CLASS_STATUS_KEY } from '@/modules/teacher/constants/teacher-kit.constants';

export type {
  AcaraPhaseKey,
  BandChipProps,
  BandKey,
  ClassBadgeProps,
  DeltaFormat,
  DeltaTextProps,
  InitialsAvatarProps,
  KpiCardProps,
  PhaseChipProps,
  SectionCardProps,
  TeacherPageCardProps,
  TeacherPageHeaderProps,
  TeacherStatus,
  TeacherStatusPillProps,
  ToneChipProps,
  ToneChipTone,
} from '@/modules/teacher/types/teacher-kit.types';
export type {
  BackButtonProps,
  BreadcrumbItemDef,
  BreadcrumbsProps,
  ExportButtonsProps,
  FilterPillOption,
  FilterPillsProps,
  PillSearchProps,
  PillSelectOption,
  PillSelectProps,
  TeacherButtonProps,
  ViewToggleProps,
  ViewToggleValue,
} from '@/modules/teacher/types/teacher-kit-controls.types';
