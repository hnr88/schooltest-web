import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type PageToken = number | 'ellipsis';

export interface SearchPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface SearchEmptyStateProps {
  icon: LucideIcon;
  title: string;
  sub: string;
  onReset: () => void;
}

export interface SearchCardSkeletonListProps {
  count?: number;
  label: string;
  className?: string;
}

export interface SearchResultsPanelProps {
  /** `data-slot` the pane's e2e contract addresses this column by. */
  slot: string;
  /** Accessible name for the scroll region (the a11y contract for `scroll-region`). */
  regionLabel: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface SearchSortOption {
  value: string;
  label: string;
}

export interface SearchSortMenuProps {
  label: string;
  value: string;
  options: readonly SearchSortOption[];
  isDefault: boolean;
  onValueChange: (value: string) => void;
}

/** One removable pill in the design's applied-filter row (spec 01 §8.2). */
export interface AppliedFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface SearchAppliedChipsProps {
  chips: readonly AppliedFilterChip[];
  emptyLabel: string;
  removeLabel: (label: string) => string;
}

export interface SearchFiltersDialogProps {
  triggerLabel: string;
  title: string;
  /** The dialog's accessible description, under the title. */
  description: string;
  activeCount: number;
  countLabel: string;
  closeLabel: string;
  clearLabel: string;
  applyLabel: string;
  onClear: () => void;
  children: ReactNode;
}

export interface SearchToolbarProps {
  /** Already-formatted result count — the live-announced heading of the pane. */
  count: string;
  filters: ReactNode;
  chips: ReactNode;
  actions?: ReactNode;
}
