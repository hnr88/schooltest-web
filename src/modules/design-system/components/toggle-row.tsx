'use client';

import { useId } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { ToggleRowProps } from '@/modules/design-system/types/primitives.types';

// DS §36 "toggle rows on dividers" (Parent settings → Notifications card): each
// row is 12px/0 padding with a #F1F5F9 hairline BETWEEN rows — the last row has
// none — a 14/600 navy title over a 13px slate description, and the switch pinned
// right. Canonical switch geometry: 42x24 track, 18px knob, 3px inset; the 3px
// side padding + 1px transparent border make the primitive's own
// `translate-x(100% - 2px)` land exactly on the canonical travel. The geometry
// overrides are marked important because the primitive states them behind
// data-[size=default]/group variants that out-specify a plain utility.
// The switch's own ::after grows the pointer target: -inset-y-3 on a 24px track is
// 24 + 12 + 12 = 48px tall, and the primitive's -inset-x-3 on a 42px track is
// 42 + 12 + 12 = 66px wide. Both clear 44px with headroom, and the VISUAL 42x24 box
// is untouched.
const SWITCH_CLASSES =
  'h-6! w-10.5! px-0.75 after:-inset-y-3 [&_[data-slot=switch-thumb]]:size-4.5! [&_[data-slot=switch-thumb]]:bg-card [&_[data-slot=switch-thumb]]:shadow-sm';

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: ToggleRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  // base-ui's <span role="switch"> cannot be named by a plain <label for>. It ships a
  // layout-effect fallback that stamps `${id}-label` onto the associated label after
  // hydration, so the SERVER-rendered switch has no accessible name at all and axe
  // fires SERIOUS aria-toggle-field-name on first paint. Naming it here makes the
  // association explicit and correct in the SSR output, with no hydration race.
  const labelId = `${id}-label`;

  return (
    <div
      data-slot="toggle-row"
      className={cn(
        'flex items-center gap-3.5 border-b border-divider py-3 last:border-b-0',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Label id={labelId} htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {description ? (
          <span id={descriptionId} className="text-body-sm text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onCheckedChange={(next) => onCheckedChange(next)}
        className={SWITCH_CLASSES}
      />
    </div>
  );
}

export { ToggleRow };
