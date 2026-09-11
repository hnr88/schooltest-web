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
      className={cn('w-auto min-w-[212px] rounded-2xl border border-[#EEF1F6] p-1.5 shadow-[0_16px_40px_rgba(14,35,80,0.18)] ring-0', className)}
      {...props}
    />
  );
}

function SelectItem({ className, ...props }: ComponentProps<typeof SelectItemPrimitive>) {
  return (
    <SelectItemPrimitive
      data-slot="select-item"
      className={cn('rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium focus:bg-muted focus:text-foreground', className)}
      {...props}
    />
  );
}

export { SelectContent, SelectItem };
