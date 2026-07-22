import { cn } from '@/lib/utils';

import type { RowActionsClusterProps } from '@/modules/design-system/types/record.types';

// Canonical RowActionsCluster (§02.3 — Students roster, Parents, All results):
// flex, 6px gap, pinned to the end of its grid cell.
// It exists so a data row's trailing actions are ONE positioned object rather than
// N loose icon buttons each solving alignment on its own. The children are
// `IconButton`s / `Button` links; the cluster only owns spacing and the end pin.
function RowActionsCluster({ className, ...props }: RowActionsClusterProps) {
  return (
    <div
      data-slot="row-actions-cluster"
      className={cn('flex shrink-0 items-center justify-self-end gap-1.5', className)}
      {...props}
    />
  );
}

export { RowActionsCluster };
