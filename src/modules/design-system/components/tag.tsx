'use client';

import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { TagProps } from '../types/design-system.types';

function Tag({ label, onRemove, removeLabel, className }: TagProps) {
  return (
    <span
      data-slot="tag"
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground',
        className
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="inline-flex size-4 items-center justify-center rounded-full transition-colors hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <XIcon aria-hidden="true" className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

export { Tag };
