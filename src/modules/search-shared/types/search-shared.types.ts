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

export interface SearchCardSkeletonGridProps {
  count?: number;
  label: string;
  card: ReactNode;
}
