'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/modules/design-system';
import { PortalSwitch } from '@/modules/notifications/components/PortalSwitch';

// Settings → Notifications row (.qa/design/spec/03 §4.1 section 3): align-items
// centre, 16px gap, 16px vertical padding, a #EEF1F6 hairline between siblings, a
// 14/600 navy label over a 12.5px caption, and the PortalToggle pinned right.
interface PortalToggleRowProps {
  title: string;
  description: string;
  helper?: string;
  helperTone?: 'warning' | 'muted';
  describedById?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const HELPER_CLASSES = {
  warning: 'text-warning-ink',
  muted: 'text-body',
} as const;

export function PortalToggleRow({
  title,
  description,
  helper,
  helperTone = 'warning',
  describedById,
  checked,
  disabled = false,
  onCheckedChange,
}: PortalToggleRowProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const helperId = `${id}-helper`;
  const describedBy = [descriptionId, helper === undefined ? describedById : helperId]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');

  return (
    <div
      data-slot="portal-toggle-row"
      className="flex items-center gap-4 border-b border-divider py-4 last:border-b-0"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {/* A real <label for> so the title is a click target for the switch —
            base-ui resolves the association for its span-rendered role="switch".
            The explicit id + aria-labelledby keeps the accessible name in the SERVER
            markup instead of waiting for base-ui's post-hydration fallback. */}
        <Label
          id={labelId}
          htmlFor={id}
          className="w-fit text-body-md font-semibold text-foreground"
        >
          {title}
        </Label>
        <span id={descriptionId} className="mt-0.5 text-meta text-body">
          {description}
        </span>
        {helper ? (
          <span id={helperId} className={cn('mt-1 text-meta font-medium', HELPER_CLASSES[helperTone])}>
            {helper}
          </span>
        ) : null}
      </div>
      <PortalSwitch
        id={id}
        checked={checked}
        disabled={disabled}
        labelledById={labelId}
        describedById={describedBy}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
