import { cn } from '@/lib/utils';

import type { DataPanelProps } from '@/modules/design-system/types/data-display.types';

// Canonical roster/history panel: ONE flush white surface, radius 16, hairline
// rows inside it, a single shadow on the panel itself (never per row).
function DataPanel({ className, ...props }: DataPanelProps) {
  return (
    <section
      data-slot="data-panel"
      className={cn(
        'overflow-hidden rounded-panel border border-border bg-card shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export { DataPanel };
