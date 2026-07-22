import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ChildRosterFactProps {
  label: string;
  value?: string | null;
  children?: ReactNode;
  className?: string;
}

// One roster/history cell. The column label is visible only below `lg`, where the
// grid row folds into a stacked definition list and the head strip is hidden.
// Text values truncate; a pill child is never clipped.
export function ChildRosterFact({ label, value, children, className }: ChildRosterFactProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="text-overline font-bold tracking-overline text-muted-foreground uppercase lg:sr-only">
        {label}
      </dt>
      <dd
        className={cn(
          'min-w-0',
          children ? null : 'truncate',
          value ? 'text-slate-600' : 'text-muted-foreground',
        )}
      >
        {children ?? value ?? '—'}
      </dd>
    </div>
  );
}
