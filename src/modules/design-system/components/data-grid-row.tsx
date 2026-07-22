import { cn } from '@/lib/utils';

import type {
  DataGridHeadRowProps,
  DataGridRowProps,
} from '@/modules/design-system/types/data-display.types';

// Canonical list rows are CSS-grid rows, never <table> cells: the column template
// is passed by the surface (grid-cols-* utility) so each screen keeps its own
// rhythm while the hairline, padding and hover stay identical everywhere.
function DataGridHeadRow({ className, ...props }: DataGridHeadRowProps) {
  return (
    <div
      data-slot="data-grid-head-row"
      className={cn(
        'grid items-center gap-3 border-b border-border bg-background px-5 py-3 text-overline font-bold tracking-overline text-slate-600 uppercase',
        className,
      )}
      {...props}
    />
  );
}

function DataGridRow({
  element: Element = 'div',
  interactive = false,
  last = false,
  className,
  ...props
}: DataGridRowProps) {
  return (
    <Element
      data-slot="data-grid-row"
      className={cn(
        'grid items-center gap-3 px-5 py-3 text-sm',
        last ? null : 'border-b border-muted',
        interactive
          ? 'transition-colors duration-200 ease-out-expo hover:bg-background motion-reduce:transition-none'
          : null,
        className,
      )}
      {...props}
    />
  );
}

export { DataGridHeadRow, DataGridRow };
