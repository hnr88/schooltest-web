import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type QueryErrorCause = 'http' | 'network' | 'contract' | 'unknown';

export type QueryErrorState =
  | { kind: 'gone' }
  | { kind: 'forbidden' }
  | { kind: 'broken'; cause: QueryErrorCause; status?: number };

export interface QueryErrorFallbackProps {
  error: unknown;
  action: ReactNode;
  goneIcon?: LucideIcon;
  goneTitle?: string;
  goneDescription?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}
