import type { ComponentProps } from 'react';

import type { ButtonProps } from '@/modules/design-system';

/**
 * Teacher Portal v2 kit (`components/v2/`) — control prop types: buttons,
 * search, selects, the view toggle, filter pills and the breadcrumb row.
 */

export type TeacherButtonTone =
  | 'primary'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'dangerOutline'
  | 'inverse';

/** xs 32 r8 · sm 34 r9 · md 38 r9 · lg 40 r10 · xl 42 r8 · 2xl 46 r10. */
export type TeacherButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface TeacherButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  tone?: TeacherButtonTone;
  size?: TeacherButtonSize;
}

export interface ExportButtonsProps {
  onPdf: () => void;
  onLlm: () => void;
  /** Tooltip (`title`) of each button — the design words them per surface. */
  pdfTitle?: string;
  llmTitle?: string;
  pdfPending?: boolean;
  llmPending?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface PillSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Accessible name of the input. */
  label: string;
  /** grey #F5F6F8 36px r9 (classes) · white bordered r12 (students, live). */
  variant?: 'grey' | 'white';
  /** white only: md 40px · lg 42px. */
  size?: 'md' | 'lg';
  id?: string;
  className?: string;
}

export interface PillSelectOption {
  value: string;
  label: string;
}

export interface PillSelectProps
  extends Omit<ComponentProps<'select'>, 'size' | 'onChange' | 'children'> {
  options: readonly PillSelectOption[];
  onValueChange: (value: string) => void;
  /** Accessible name of the select. */
  label: string;
  /** sm 36/r9 filters · md 38/r9 skill · lg 40/r10 class switcher · xl 42/r12 student sort. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export type ViewToggleValue = 'tiles' | 'list';

export interface ViewToggleProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  value: ViewToggleValue;
  onValueChange: (value: ViewToggleValue) => void;
  /** Accessible names of the two buttons; default "Tiles" / "List". */
  labels?: { tiles: string; list: string };
  /** Accessible name of the group; default "Layout". */
  label?: string;
}

export interface FilterPillOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterPillsProps {
  options: readonly FilterPillOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name of the group. */
  label: string;
  /** sm padding 8/15 (live tab) · md 34px (family reports). */
  size?: 'sm' | 'md';
  className?: string;
}

export interface BackButtonProps {
  /** A route renders a Link; omit it and pass `onClick` for a button. */
  href?: string;
  onClick?: () => void;
  label?: string;
  title?: string;
  className?: string;
}

export interface BreadcrumbItemDef {
  label: string;
  /** Omit on the current page (the last item). */
  href?: string;
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItemDef[];
  /** Renders the grey Back button first. */
  back?: BackButtonProps;
  className?: string;
}
