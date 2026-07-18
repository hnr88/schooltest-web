import type { ComponentProps } from 'react';

import {
  SelectContent as SelectContentPrimitive,
  SelectItem as SelectItemPrimitive,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Same spec hover treatment as the menu wrappers (DS doc §11) — muted, not teal.
function SelectContent({ className, ...props }: ComponentProps<typeof SelectContentPrimitive>) {
  return (
    <SelectContentPrimitive
      data-slot="select-content"
      className={cn('rounded-xl border border-border p-1.5 shadow-lg ring-0', className)}
      {...props}
    />
  );
}

function SelectItem({ className, ...props }: ComponentProps<typeof SelectItemPrimitive>) {
  return (
    <SelectItemPrimitive
      data-slot="select-item"
      className={cn('font-medium focus:bg-muted focus:text-foreground', className)}
      {...props}
    />
  );
}

export { SelectContent, SelectItem };
