import type { ComponentProps } from 'react';

import { Textarea as TextareaPrimitive } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/** journeys-and-bugs BUG-003 — the shared 12px radius / 15px padding shell the
 *  canonical `Input` uses, on the textarea; height stays content-driven. */
function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <TextareaPrimitive
      data-slot="ds-textarea"
      className={cn('rounded-xl px-[15px] py-3 text-sm', className)}
      {...props}
    />
  );
}

export { Textarea };
